package com.jcustom.backend.repository;

import com.jcustom.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByStudySetId(Long studySetId);

    // Returns all cards of a given type in one single DB query (avoids N+1 per study set)
    List<Question> findAllByTypeOrderById(Question.QuestionType type);
}
