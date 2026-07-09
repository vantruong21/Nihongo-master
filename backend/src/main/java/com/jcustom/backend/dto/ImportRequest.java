package com.jcustom.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class ImportRequest {
    private String title;
    private String description;
    private List<CardDto> cards;

    @Data
    public static class CardDto {
        private String prompt;
        private String answer;
        private String hint;
        private String mnemonic; // Optional memorization tip
        private String level;    // JLPT level: N5, N4, N3, N2, N1
        private String type; // VOCAB, KANJI, GRAMMAR
    }
}
