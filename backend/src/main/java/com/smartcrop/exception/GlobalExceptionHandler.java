package com.smartcrop.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/** Every error leaves the backend in the same shape the frontend can show: {status, message}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final Map<String, String> LABELS = Map.ofEntries(
            Map.entry("n", "Nitrogen (N)"), Map.entry("p", "Phosphorus (P)"), Map.entry("k", "Potassium (K)"),
            Map.entry("ph", "Soil pH"), Map.entry("temperature", "Temperature"), Map.entry("humidity", "Humidity"),
            Map.entry("rainfall", "Rainfall"), Map.entry("crop", "Crop"), Map.entry("district", "District"),
            Map.entry("soil", "Soil type"), Map.entry("username", "Username"), Map.entry("password", "Password"));

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> api(ApiException e) {
        return body(e.getStatus(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> LABELS.getOrDefault(f.getField(), f.getField()) + " " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return body(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException e) {
        return body(HttpStatus.BAD_REQUEST, "Request body is missing or is not valid JSON (check that numbers are numeric)");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> other(Exception e) {
        if (e instanceof ErrorResponse er) { // Spring's own 404 / 405 / 415 ... keep their status
            return body(HttpStatus.valueOf(er.getStatusCode().value()), er.getBody().getDetail());
        }
        log.error("Unexpected error", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", "error");
        m.put("message", message);
        return ResponseEntity.status(status).body(m);
    }
}
