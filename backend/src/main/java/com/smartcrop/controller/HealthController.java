package com.smartcrop.controller;

import com.smartcrop.service.FlaskClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final FlaskClient flask;

    public HealthController(FlaskClient flask) {
        this.flask = flask;
    }

    /** Open /api/health in the browser to check that both services are connected. */
    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", "ok");
        m.put("backend", "UP");
        m.put("flask", flask.health() != null ? "UP" : "DOWN");
        return m;
    }
}
