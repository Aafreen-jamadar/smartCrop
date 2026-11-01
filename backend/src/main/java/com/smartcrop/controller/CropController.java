package com.smartcrop.controller;

import com.smartcrop.dto.Dtos.CropRequest;
import com.smartcrop.dto.Dtos.CropResponse;
import com.smartcrop.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final RecommendationService service;

    public CropController(RecommendationService service) {
        this.service = service;
    }

    /**
     * POST /api/crops/recommand?username=...   (script.js spells it "recommand", so both spellings work)
     * The user is taken from the JWT, so the ?username= query parameter is accepted but not trusted.
     */
    @PostMapping({"/recommand", "/recommend"})
    public CropResponse recommend(@Valid @RequestBody CropRequest request, Authentication auth) {
        return service.recommendCrop(request, auth.getName());
    }
}
