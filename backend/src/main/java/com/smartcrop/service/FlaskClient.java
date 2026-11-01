package com.smartcrop.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcrop.dto.Dtos.CropRequest;
import com.smartcrop.dto.Dtos.FlaskCropResult;
import com.smartcrop.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/** The only class that talks to the Flask ML API (flask-api/mi_api.py). */
@Service
public class FlaskClient {

    private static final Logger log = LoggerFactory.getLogger(FlaskClient.class);

    private final RestTemplate rest;
    private final ObjectMapper mapper;
    private final String baseUrl;

    public FlaskClient(RestTemplateBuilder builder, ObjectMapper mapper,
                       @Value("${flask.base-url}") String baseUrl,
                       @Value("${flask.timeout-ms:10000}") long timeoutMs) {
        this.mapper = mapper;
        this.baseUrl = baseUrl;
        this.rest = builder
                .rootUri(baseUrl)
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .readTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    public FlaskCropResult predictCrop(CropRequest r) {
        // Flask expects capital N, P, K
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("N", r.n());
        body.put("P", r.p());
        body.put("K", r.k());
        body.put("temperature", r.temperature());
        body.put("humidity", r.humidity());
        body.put("ph", r.ph());
        body.put("rainfall", r.rainfall());
        return post("/predict", body, FlaskCropResult.class);
    }

    /** Used by GET /api/health so you can see at a glance whether Flask is reachable. */
    public Map<String, Object> health() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> m = rest.getForObject("/health", Map.class);
            return m;
        } catch (Exception e) {
            return null;
        }
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    private <T> T post(String path, Object body, Class<T> type) {
        try {
            return rest.postForObject(path, body, type);
        } catch (ResourceAccessException e) {            // connection refused / timeout
            log.warn("Flask API not reachable at {}: {}", baseUrl, e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The ML service is not available right now. Please try again in a moment.");
        } catch (RestClientResponseException e) {        // Flask answered with 4xx / 5xx
            String message = flaskMessage(e);
            int code = e.getStatusCode().value();
            HttpStatus status = code == 503 ? HttpStatus.SERVICE_UNAVAILABLE
                    : (code >= 400 && code < 500) ? HttpStatus.BAD_REQUEST
                    : HttpStatus.BAD_GATEWAY;
            log.warn("Flask {} returned {}: {}", path, code, message);
            throw new ApiException(status, message);
        }
    }

    private String flaskMessage(RestClientResponseException e) {
        try {
            JsonNode node = mapper.readTree(e.getResponseBodyAsString());
            if (node.hasNonNull("message")) {
                return node.get("message").asText();
            }
        } catch (Exception ignored) {
            // body was not JSON
        }
        return "ML service error (HTTP " + e.getStatusCode().value() + ")";
    }
}
