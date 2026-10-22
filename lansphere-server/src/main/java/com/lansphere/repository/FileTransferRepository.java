package com.lansphere.repository;

import com.lansphere.entity.FileTransfer;
import com.lansphere.entity.enums.FileTransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileTransferRepository extends JpaRepository<FileTransfer, Long> {

    List<FileTransfer> findBySenderIdOrderByCreatedAtDesc(Long senderId);

    List<FileTransfer> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);

    List<FileTransfer> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    List<FileTransfer> findByStatus(FileTransferStatus status);

    List<FileTransfer> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);

    List<FileTransfer> findTop10ByOrderByCreatedAtDesc();

    long countByStatus(FileTransferStatus status);
}
