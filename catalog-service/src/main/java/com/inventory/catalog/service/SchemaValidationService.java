package com.inventory.catalog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
public class SchemaValidationService {
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);
    
    public boolean validateAttributes(Map<String, Object> schemaMap, Map<String, Object> attributes) {
        try {
            // Convert schema map to JSON string
            String schemaJson = objectMapper.writeValueAsString(schemaMap);
            JsonNode schemaNode = objectMapper.readTree(schemaJson);
            
            // Create JSON Schema
            JsonSchema schema = factory.getSchema(schemaNode);
            
            // Convert attributes to JSON node
            String attributesJson = objectMapper.writeValueAsString(attributes);
            JsonNode attributesNode = objectMapper.readTree(attributesJson);
            
            // Validate
            Set<ValidationMessage> errors = schema.validate(attributesNode);
            
            return errors.isEmpty();
        } catch (Exception e) {
            throw new RuntimeException("Schema validation failed: " + e.getMessage(), e);
        }
    }
    
    public Set<ValidationMessage> getValidationErrors(Map<String, Object> schemaMap, Map<String, Object> attributes) {
        try {
            String schemaJson = objectMapper.writeValueAsString(schemaMap);
            JsonNode schemaNode = objectMapper.readTree(schemaJson);
            
            JsonSchema schema = factory.getSchema(schemaNode);
            
            String attributesJson = objectMapper.writeValueAsString(attributes);
            JsonNode attributesNode = objectMapper.readTree(attributesJson);
            
            return schema.validate(attributesNode);
        } catch (Exception e) {
            throw new RuntimeException("Schema validation failed: " + e.getMessage(), e);
        }
    }
}
