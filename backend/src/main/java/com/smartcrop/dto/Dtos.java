package com.smartcrop.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Every request/response shape in one place. */
public final class Dtos {
    private Dtos() {}

    // ------------------------------------------------------------------ auth
    public record LoginRequest(
            @NotBlank(message = "is required") String username,
            @NotBlank(message = "is required") String password) {}

    public record RegisterRequest(
            @NotBlank(message = "is required") @Size(min = 3, max = 50, message = "must be 3-50 characters") String username,
            @NotBlank(message = "is required") @Size(min = 6, max = 100, message = "must be at least 6 characters") String password) {}

    /** The frontend reads: status, message, username, token. */
    public record AuthResponse(String status, String message, String username, String token) {}

    // ------------------------------------------------------------------ crop
    /** Frontend sends n, p, k, temperature, humidity, ph, rainfall (lower-case). */
    public record CropRequest(
            @NotNull(message = "is required") @DecimalMin(value = "0", message = "must be between 0 and 300") @DecimalMax(value = "300", message = "must be between 0 and 300")
            @JsonAlias({"N", "nitrogen"}) Double n,
            @NotNull(message = "is required") @DecimalMin(value = "0", message = "must be between 0 and 300") @DecimalMax(value = "300", message = "must be between 0 and 300")
            @JsonAlias({"P", "phosphorus"}) Double p,
            @NotNull(message = "is required") @DecimalMin(value = "0", message = "must be between 0 and 300") @DecimalMax(value = "300", message = "must be between 0 and 300")
            @JsonAlias({"K", "potassium"}) Double k,
            @NotNull(message = "is required") @DecimalMin(value = "-50", message = "must be between -50 and 60") @DecimalMax(value = "60", message = "must be between -50 and 60")
            Double temperature,
            @NotNull(message = "is required") @DecimalMin(value = "0", message = "must be between 0 and 100") @DecimalMax(value = "100", message = "must be between 0 and 100")
            Double humidity,
            @NotNull(message = "is required") @DecimalMin(value = "0", message = "must be between 0 and 14") @DecimalMax(value = "14", message = "must be between 0 and 14")
            Double ph,
            @NotNull(message = "is required") @DecimalMin(value = "0", message = "must be between 0 and 3000") @DecimalMax(value = "3000", message = "must be between 0 and 3000")
            Double rainfall) {}

    public record Alternative(String name, Double probability) {}

    /** Frontend reads result.crop; the other fields are extra output to display. */
    public record CropResponse(String status, String crop, String season, Double confidence,
                               List<Alternative> alternatives, String message) {}

    // --------------------------------------------------------------- history
    public record HistoryItem(Long id, String type, String result, Double confidence,
                              Map<String, Object> inputs, Instant createdAt) {}

    // ----------------------------------------- what the Flask API sends back
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FlaskCropResult(String status, String crop, Double confidence, List<FlaskCropAlt> alternatives) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FlaskCropAlt(String crop, Double probability) {}
}
