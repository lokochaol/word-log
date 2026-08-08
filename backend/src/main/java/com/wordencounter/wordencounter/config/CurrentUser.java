package com.wordencounter.wordencounter.config;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Resolves the Google account ("sub" claim) of the authenticated caller, which is
 * used to scope every word to its owner.
 */
@Component
public class CurrentUser {

    public String ownerSub() {
        Object principal = SecurityContextHolder.getContext().getAuthentication();
        if (principal instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            return jwt.getSubject();
        }
        throw new IllegalStateException("No authenticated Google user in the current security context");
    }
}
