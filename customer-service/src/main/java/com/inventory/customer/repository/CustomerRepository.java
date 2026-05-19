package com.inventory.customer.repository;

import com.inventory.customer.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByOrgId(Long orgId);
}
