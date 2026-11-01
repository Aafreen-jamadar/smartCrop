package com.smartcrop.controller;

import com.smartcrop.dto.Dtos.AuthResponse;
import com.smartcrop.dto.Dtos.LoginRequest;
import com.smartcrop.dto.Dtos.RegisterRequest;
import com.smartcrop.entity.AppUser;
import com.smartcrop.exception.ApiException;
import com.smartcrop.repository.UserRepository;
import com.smartcrop.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    /** POST /api/auth/login  {username, password}  ->  {status, message, username, token} */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AppUser user = users.findByUsernameIgnoreCase(request.username().trim())
                .filter(u -> encoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        return new AuthResponse("success", "Login Successful!", user.getUsername(), jwt.generateToken(user.getUsername()));
    }

    /** POST /api/auth/register  {username, password}  -> same response as login (you are logged in straight away). */
    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String username = request.username().trim();
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already taken");
        }
        AppUser saved = users.save(new AppUser(username, encoder.encode(request.password())));
        return new AuthResponse("success", "Account created!", saved.getUsername(), jwt.generateToken(saved.getUsername()));
    }
}
