package com.jcustom.backend.controller;

import com.jcustom.backend.dto.ImportRequest;
import com.jcustom.backend.entity.StudySet;
import com.jcustom.backend.service.StudySetService;
import com.jcustom.backend.repository.StudySetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-sets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép Frontend truy cập trong giai đoạn phát triển
public class StudySetController {

    private final StudySetService studySetService;
    private final StudySetRepository studySetRepository;

    @PostMapping("/import")
    public ResponseEntity<StudySet> importStudySet(@RequestBody ImportRequest request) {
        System.out.println("Received import request for: " + request.getTitle());
        System.out.println("Number of cards: " + (request.getCards() != null ? request.getCards().size() : 0));
        try {
            StudySet saved = studySetService.importStudySet(request);
            System.out.println("Successfully saved StudySet with ID: " + saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Error during import: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping
    public ResponseEntity<List<com.jcustom.backend.dto.StudySetSummaryDTO>> getAllStudySets() {
        return ResponseEntity.ok(studySetRepository.findAllSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudySet> getStudySetById(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        return studySetRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudySet(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        return studySetRepository.findById(id).map(existing -> {
            String newTitle = body.get("title");
            String newDescription = body.get("description");
            if (newTitle != null && !newTitle.isBlank()) {
                existing.setTitle(newTitle);
            }
            if (newDescription != null) {
                existing.setDescription(newDescription);
            }
            @SuppressWarnings("null")
            StudySet updated = studySetRepository.save(existing);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudySet(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        if (!studySetRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            studySetService.deleteStudySet(id);
            return ResponseEntity.ok().body(java.util.Map.of("message", "Study set deleted successfully"));
        } catch (Exception e) {
            System.err.println("Error deleting study set: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to delete study set"));
        }
    }
}
