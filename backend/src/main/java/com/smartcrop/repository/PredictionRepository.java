package com.smartcrop.repository;

import com.smartcrop.entity.PredictionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PredictionRepository extends JpaRepository<PredictionLog, Long> {
    List<PredictionLog> findTop20ByUsernameIgnoreCaseOrderByCreatedAtDesc(String username);
}
