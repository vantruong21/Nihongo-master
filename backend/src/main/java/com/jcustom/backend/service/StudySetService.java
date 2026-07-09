package com.jcustom.backend.service;

import com.jcustom.backend.dto.ImportRequest;
import com.jcustom.backend.entity.Question;
import com.jcustom.backend.entity.StudySet;
import com.jcustom.backend.repository.StudySetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudySetService {

    private final StudySetRepository studySetRepository;
    private final com.jcustom.backend.repository.QuizSessionRepository quizSessionRepository;

    @Transactional
    @SuppressWarnings("null")
    public void deleteStudySet(Long id) {
        // Xoá tất cả QuizSession liên kết với StudySet này trước
        quizSessionRepository.deleteByStudySetId(id);
        
        // Sau đó xoá chính StudySet (Questions sẽ tự động bị xoá do cascade = CascadeType.ALL)
        studySetRepository.deleteById(id);
    }

    @Transactional
    @SuppressWarnings("null")
    public StudySet importStudySet(ImportRequest request) {
        StudySet studySet = StudySet.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        if (request.getCards() != null) {
            studySet.setQuestions(request.getCards().stream().map(cardDto -> {
                Question question = Question.builder()
                        .prompt(cardDto.getPrompt())
                        .answer(cardDto.getAnswer())
                        .hint(cardDto.getHint())
                        .mnemonic(cardDto.getMnemonic())
                        .level(cardDto.getLevel())
                        .type(parseQuestionType(cardDto.getType()))
                        .studySet(studySet)
                        .build();
                return question;
            }).collect(Collectors.toList()));
        }

        return studySetRepository.save(studySet);
    }

    private Question.QuestionType parseQuestionType(String type) {
        try {
            return Question.QuestionType.valueOf(type.toUpperCase());
        } catch (Exception e) {
            return Question.QuestionType.VOCAB; // Mặc định là VOCAB nếu type không hợp lệ
        }
    }
}
