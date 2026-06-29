package com.jcustom.backend.repository;

import com.jcustom.backend.entity.StudySet;
import com.jcustom.backend.dto.StudySetSummaryDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudySetRepository extends JpaRepository<StudySet, Long> {

    @Query("SELECT new com.jcustom.backend.dto.StudySetSummaryDTO(s.id, s.title, s.description, size(s.questions)) FROM StudySet s")
    List<StudySetSummaryDTO> findAllSummary();
}

