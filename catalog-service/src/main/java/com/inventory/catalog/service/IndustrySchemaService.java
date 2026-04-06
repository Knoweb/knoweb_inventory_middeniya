package com.inventory.catalog.service;

import com.inventory.catalog.model.IndustrySchema;
import com.inventory.catalog.repository.IndustrySchemaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class IndustrySchemaService {
    
    @Autowired
    private IndustrySchemaRepository schemaRepository;
    
    @Autowired
    private SchemaValidationService validationService;
    
    public IndustrySchema createSchema(IndustrySchema schema) {
        if (schemaRepository.existsByIndustryType(schema.getIndustryType())) {
            throw new RuntimeException("Schema already exists for industry: " + schema.getIndustryType());
        }
        
        schema.setCreatedAt(LocalDateTime.now());
        schema.setUpdatedAt(LocalDateTime.now());
        return schemaRepository.save(schema);
    }
    
    public IndustrySchema getSchemaByIndustryType(String industryType) {
        return schemaRepository.findByIndustryType(industryType)
                .orElseThrow(() -> new RuntimeException("Schema not found for industry: " + industryType));
    }
    
    public List<IndustrySchema> getAllSchemas() {
        return schemaRepository.findAll();
    }
    
    public List<IndustrySchema> getActiveSchemas() {
        return schemaRepository.findByIsActive(true);
    }
    
    public IndustrySchema updateSchema(Long id, IndustrySchema updatedSchema) {
        IndustrySchema existing = schemaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schema not found with id: " + id));
        
        existing.setSchemaName(updatedSchema.getSchemaName());
        existing.setDescription(updatedSchema.getDescription());
        existing.setJsonSchema(updatedSchema.getJsonSchema());
        existing.setDefaultValues(updatedSchema.getDefaultValues());
        existing.setUiConfig(updatedSchema.getUiConfig());
        existing.setIsActive(updatedSchema.getIsActive());
        existing.setVersion(existing.getVersion() + 1);
        existing.setUpdatedAt(LocalDateTime.now());
        
        return schemaRepository.save(existing);
    }
    
    public void deleteSchema(Long id) {
        schemaRepository.deleteById(id);
    }
    
    public boolean validateAttributes(String industryType, Map<String, Object> attributes) {
        IndustrySchema schema = getSchemaByIndustryType(industryType);
        return validationService.validateAttributes(schema.getJsonSchema(), attributes);
    }
}
