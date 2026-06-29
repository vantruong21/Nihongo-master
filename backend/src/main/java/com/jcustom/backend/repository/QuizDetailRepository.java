package com.jcustom.backend.repository;

import com.jcustom.backend.entity.QuizDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizDetailRepository extends JpaRepository<QuizDetail, Long> {

    // Tìm các câu hỏi bị sai nhiều nhất (Weak points)
    @Query("SELECT d.question.id, d.question.prompt, d.question.answer, COUNT(d) as wrongCount " +
           "FROM QuizDetail d WHERE d.isCorrect = false " +
           "GROUP BY d.question.id, d.question.prompt, d.question.answer " +
           "ORDER BY COUNT(d) DESC")
    List<Object[]> findWeakQuestions(org.springframework.data.domain.Pageable pageable);
}
