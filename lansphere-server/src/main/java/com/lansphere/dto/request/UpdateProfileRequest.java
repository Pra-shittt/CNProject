package com.lansphere.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    private String displayName;
    private String email;
    private String bio;
    private String avatarUrl;
    private String status;
}
