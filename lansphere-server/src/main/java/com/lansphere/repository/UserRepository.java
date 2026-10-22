package com.lansphere.repository;

import com.lansphere.entity.User;
import com.lansphere.entity.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByStatus(UserStatus status);

    List<User> findByStatusNot(UserStatus status);

    List<User> findByUsernameContainingIgnoreCase(String query);

    List<User> findByIdNot(Long id);
}
