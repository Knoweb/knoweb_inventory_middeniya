package com.inventory.identity.controller;

import com.inventory.identity.dto.MessageResponse;
import com.inventory.identity.dto.UserResponse;
import com.inventory.identity.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/username/{username}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }
    
    @GetMapping("/organization/{orgId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserResponse>> getUsersByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(userService.getUsersByOrganization(orgId));
    }
    
    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserResponse>> getUsersByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(userService.getUsersByBranch(branchId));
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ORG_ADMIN')")
    public ResponseEntity<UserResponse> updateUserStatus(@PathVariable Long id, 
                                                         @RequestParam Boolean isActive) {
        return ResponseEntity.ok(userService.updateUserStatus(id, isActive));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}
