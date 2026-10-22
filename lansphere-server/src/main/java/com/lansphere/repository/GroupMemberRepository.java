package com.lansphere.repository;

import com.lansphere.entity.GroupMember;
import com.lansphere.entity.enums.GroupMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findByGroupId(Long groupId);

    List<GroupMember> findByUserId(Long userId);

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    long countByGroupId(Long groupId);

    List<GroupMember> findByGroupIdAndRole(Long groupId, GroupMemberRole role);

    void deleteByGroupIdAndUserId(Long groupId, Long userId);
}
