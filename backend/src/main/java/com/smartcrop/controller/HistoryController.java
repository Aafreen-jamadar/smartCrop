package com.smartcrop.controller;

import com.smartcrop.dto.Dtos.HistoryItem;
import com.smartcrop.service.RecommendationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final RecommendationService service;

    public HistoryController(RecommendationService service) {
        this.service = service;
    }

    /** GET /api/history  -> the logged-in user's last 20 crop + fertilizer recommendations. */
    @GetMapping
    public List<HistoryItem> mine(Authentication auth) {
        return service.history(auth.getName());
    }
}
