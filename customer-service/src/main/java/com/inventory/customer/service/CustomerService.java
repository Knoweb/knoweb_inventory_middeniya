package com.inventory.customer.service;

import com.inventory.customer.dto.CustomerRequestDto;
import com.inventory.customer.model.Customer;
import com.inventory.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public List<Customer> getCustomersByOrganization(Long orgId) {
        return customerRepository.findByOrgId(orgId);
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Long id, CustomerRequestDto dto) {
        return customerRepository.findById(id)
                .map(existing -> {
                    if (dto.getName() != null) {
                        existing.setName(dto.getName());
                    }
                    if (dto.getContactInfo() != null) {
                        existing.setContactInfo(dto.getContactInfo());
                    }
                    if (dto.getOrgId() != null) {
                        existing.setOrgId(dto.getOrgId());
                    }
                    return customerRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
    }

    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }
}
