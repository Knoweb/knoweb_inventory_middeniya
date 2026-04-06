package com.inventory.catalog.controller;

import com.inventory.catalog.model.IndustrySchema;
import com.inventory.catalog.service.IndustrySchemaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schemas")
public class SchemaController {
    
    @Autowired
    private IndustrySchemaService schemaService;
    
    @PostMapping
    public ResponseEntity<IndustrySchema> createSchema(@RequestBody IndustrySchema schema) {
        return ResponseEntity.ok(schemaService.createSchema(schema));
    }
    
    @GetMapping
    public ResponseEntity<List<IndustrySchema>> getAllSchemas() {
        return ResponseEntity.ok(schemaService.getAllSchemas());
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<IndustrySchema>> getActiveSchemas() {
        return ResponseEntity.ok(schemaService.getActiveSchemas());
    }
    
    @GetMapping("/industry/{industryType}")
    public ResponseEntity<IndustrySchema> getSchemaByIndustry(@PathVariable String industryType) {
        return ResponseEntity.ok(schemaService.getSchemaByIndustryType(industryType));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<IndustrySchema> updateSchema(@PathVariable Long id, 
                                                        @RequestBody IndustrySchema schema) {
        return ResponseEntity.ok(schemaService.updateSchema(id, schema));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchema(@PathVariable Long id) {
        schemaService.deleteSchema(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Boolean>> validateAttributes(
            @RequestParam String industryType,
            @RequestBody Map<String, Object> attributes) {
        boolean isValid = schemaService.validateAttributes(industryType, attributes);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }
}
