package com.lansphere.repository;

import com.lansphere.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<Message> findTop50ByConversationIdOrderByCreatedAtDesc(Long conversationId);

    long countByConversationId(Long conversationId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.content LIKE %:query%")
    List<Message> searchInConversation(@Param("conversationId") Long conversationId, @Param("query") String query);

    @Modifying
    @Query("UPDATE Message m SET m.status = com.lansphere.entity.enums.MessageStatus.READ WHERE m.conversation.id = :conversationId AND m.sender.id != :userId")
    void markAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
