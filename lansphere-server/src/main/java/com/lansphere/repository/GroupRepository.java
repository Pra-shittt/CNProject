package com.lansphere.repository;

import com.lansphere.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    List<Group> findByOwnerId(Long ownerId);

    List<Group> findByIsPublicTrue();

    List<Group> findByNameContainingIgnoreCase(String name);

    @Query("SELECT g FROM Group g JOIN g.members m WHERE m.user.id = :userId")
    List<Group> findByMemberUserId(@Param("userId") Long userId);
}
