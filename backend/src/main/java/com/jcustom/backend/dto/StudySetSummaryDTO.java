package com.jcustom.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySetSummaryDTO {
    private Long id;
    private String title;
    private String description;
    private Integer cardCount;

    // Custom constructor to match JPQL SELECT new expression safely
    public StudySetSummaryDTO(Long id, String title, String description, int cardCount) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.cardCount = cardCount;
    }
}
