package com.smartcrop.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcrop.dto.Dtos.Alternative;
import com.smartcrop.dto.Dtos.CropRequest;
import com.smartcrop.dto.Dtos.CropResponse;
import com.smartcrop.dto.Dtos.FlaskCropResult;
import com.smartcrop.dto.Dtos.HistoryItem;
import com.smartcrop.entity.PredictionLog;
import com.smartcrop.exception.ApiException;
import com.smartcrop.repository.PredictionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    private final FlaskClient flask;
    private final PredictionRepository history;
    private final ObjectMapper mapper;

    public RecommendationService(FlaskClient flask, PredictionRepository history, ObjectMapper mapper) {
        this.flask = flask;
        this.history = history;
        this.mapper = mapper;
    }

    public CropResponse recommendCrop(CropRequest request, String username) {
        FlaskCropResult result = flask.predictCrop(request);
        if (result == null || result.crop() == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ML service returned an empty result");
        }

        List<Alternative> alternatives = result.alternatives() == null ? List.of()
                : result.alternatives().stream().map(a -> new Alternative(a.crop(), a.probability())).toList();

        save(username, "CROP", result.crop(), result.confidence(), request);

        return new CropResponse("success", result.crop(), CropInfo.season(result.crop()), result.confidence(),
                alternatives, "Best crop for your soil and weather: " + result.crop());
    }

    public List<HistoryItem> history(String username) {
        return history.findTop20ByUsernameIgnoreCaseOrderByCreatedAtDesc(username).stream()
                .map(p -> new HistoryItem(p.getId(), p.getType(), p.getResultName(), p.getConfidence(),
                        parse(p.getInputs()), p.getCreatedAt()))
                .toList();
    }

    // History is a bonus: if saving fails, the farmer should still get their recommendation.
    private void save(String username, String type, String resultName, Double confidence, Object request) {
        try {
            history.save(new PredictionLog(username, type, resultName, confidence, mapper.writeValueAsString(request)));
        } catch (JsonProcessingException | RuntimeException e) {
            log.warn("Could not save history entry: {}", e.getMessage());
        }
    }

    private Map<String, Object> parse(String json) {
        try {
            if (json == null) {
                return Map.of();
            }
            return mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }
}
