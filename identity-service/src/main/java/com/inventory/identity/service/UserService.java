package com.inventory.identity.service;

import com.inventory.identity.dto.UserResponse;
import com.inventory.identity.model.User;
import com.inventory.identity.repository.UserRepository;
import com.inventory.identity.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToResponse(user);
    }
    
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + username));
        return convertToResponse(user);
    }
    
    public List<UserResponse> getUsersByOrganization(Long orgId) {
        return userRepository.findByOrgId(orgId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<UserResponse> getUsersByBranch(Long branchId) {
        return userRepository.findByBranchId(branchId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        refreshTokenRepository.deleteByUser(user);
        userRepository.delete(user);
    }
    
    public UserResponse updateUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setIsActive(isActive);
        User updated = userRepository.save(user);
        return convertToResponse(updated);
    }
    
    private UserResponse convertToResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
        
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getIsActive(),
                user.getOrgId(),
                user.getBranchId(),
                roles
        );
    }
}
