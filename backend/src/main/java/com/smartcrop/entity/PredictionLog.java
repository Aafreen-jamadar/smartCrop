package com.smartcrop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** One saved recommendation (crop or fertilizer) so a farmer can see their history. */
@Entity
@Table(name = "prediction_log")
public class PredictionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    /** "CROP" or "FERTILIZER" */
    @Column(name = "prediction_type", nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private String resultName;

    private Double confidence;

    /** The request that produced the result, stored as JSON text. */
    @Column(length = 2000)
    private String inputs;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected PredictionLog() {}

    public PredictionLog(String username, String type, String resultName, Double confidence, String inputs) {
        this.username = username;
        this.type = type;
        this.resultName = resultName;
        this.confidence = confidence;
        this.inputs = inputs;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getType() { return type; }
    public String getResultName() { return resultName; }
    public Double getConfidence() { return confidence; }
    public String getInputs() { return inputs; }
    public Instant getCreatedAt() { return createdAt; }
}
