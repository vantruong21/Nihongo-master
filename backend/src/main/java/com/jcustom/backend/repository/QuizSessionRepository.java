package com.jcustom.backend.repository;

import com.jcustom.backend.entity.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {

    List<QuizSession> findAllByOrderByStartTimeDesc();

    List<QuizSession> findTop20ByOrderByStartTimeDesc();

    @Query("SELECT COUNT(s) FROM QuizSession s")
    Long countSessions();

    @Query("SELECT COALESCE(SUM(s.score), 0) FROM QuizSession s")
    Long sumCorrect();

    @Query("SELECT COALESCE(SUM(s.totalQuestions), 0) FROM QuizSession s")
    Long sumTotal();

    @Query("SELECT COUNT(s), COALESCE(SUM(s.score), 0), COALESCE(SUM(s.totalQuestions), 0) FROM QuizSession s")
    List<Object[]> getStatsSummary();

    @Query("SELECT s.startTime FROM QuizSession s ORDER BY s.startTime DESC")
    List<java.time.LocalDateTime> findAllStartTimes();

    @Query("SELECT s.startTime FROM QuizSession s ORDER BY s.startTime DESC")
    List<java.time.LocalDateTime> findRecentStartTimes(org.springframework.data.domain.Pageable pageable);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM QuizSession s WHERE s.studySet.id = :studySetId")
    void deleteByStudySetId(Long studySetId);
}
