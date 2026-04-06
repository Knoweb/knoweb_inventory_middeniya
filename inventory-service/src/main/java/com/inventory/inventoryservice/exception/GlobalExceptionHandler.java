package com.inventory.inventoryservice.exception;

import com.inventory.inventoryservice.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception caught by global handler: ", ex);

        ErrorResponse error = ErrorResponse.builder()
                .protocol("ANALYSIS_FAILURE")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Operational Error")
                .message(
                        "An unexpected exception occurred in the computational matrix. Our neural nodes are investigating.")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(ArithmeticException.class)
    public ResponseEntity<ErrorResponse> handleArithmeticException(ArithmeticException ex, HttpServletRequest request) {
        log.warn("Computational math error: {} at {}", ex.getMessage(), request.getRequestURI());

        ErrorResponse error = ErrorResponse.builder()
                .protocol("COMPUTATIONAL_EXCEPTION")
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Mathematical Inconsistency")
                .message(
                        "A computational logic error occurred (e.g., division by zero). Please verify your inventory input parameters.")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> details.put(error.getField(), error.getDefaultMessage()));

        ErrorResponse error = ErrorResponse.builder()
                .protocol("VALIDATION_EXCEPTION")
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Data integrity Breach")
                .message("The provided data nodes failed verification protocols.")
                .details(details)
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ErrorResponse> handleNullPointerException(NullPointerException ex,
            HttpServletRequest request) {
        log.error("Null pointer exception detected: ", ex);

        ErrorResponse error = ErrorResponse.builder()
                .protocol("NULL_REFERENCE_FAILURE")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Core Engine Failure")
                .message(
                        "A null reference was encountered in the service logic. This indicates a data link synchronization issue.")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
