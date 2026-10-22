package com.lansphere.repository;

import com.lansphere.entity.TransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransferHistoryRepository extends JpaRepository<TransferHistory, Long> {

    List<TransferHistory> findByFileTransferIdOrderByCreatedAtDesc(Long fileTransferId);

    List<TransferHistory> findByPerformedByIdOrderByCreatedAtDesc(Long userId);
}
