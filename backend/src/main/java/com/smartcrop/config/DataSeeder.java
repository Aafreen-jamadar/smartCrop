package com.smartcrop.config;

import com.smartcrop.entity.AppUser;
import com.smartcrop.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** The frontend has no sign-up form yet, so create one demo user to log in with. */
@Component
@ConditionalOnProperty(name = "smartcrop.seed-demo-user", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (!users.existsByUsernameIgnoreCase("demo")) {
            users.save(new AppUser("demo", encoder.encode("demo123")));
            log.info("Demo user created -> username: demo  password: demo123");
        }
    }
}
