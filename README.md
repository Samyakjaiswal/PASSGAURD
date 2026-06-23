## PassGuard — Full Project Description

---

### Project Overview

PassGuard is a client-side web application built as part of a cybersecurity awareness initiative. It analyzes the strength of passwords in real time using entropy-based scoring, character pool analysis, and pattern detection — all without sending any data to a server. Every calculation happens locally in the user's browser, making it completely private and secure by design.

---

### Purpose & Problem Statement

Weak passwords remain one of the leading causes of data breaches worldwide. Many users create passwords that are easy to remember but trivially easy to crack using modern tools. Most people have no way of knowing how secure their password actually is, or what makes one password stronger than another.

PassGuard solves this by giving instant, educational feedback. It doesn't just tell you if a password is weak — it explains exactly why, calculates how long it would take to crack, and suggests specific improvements. The goal is to educate users about password security in a way that is visual, interactive, and easy to understand.

---

### Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure and semantic markup |
| CSS3 | Styling, animations, dark/light theming |
| Vanilla JavaScript | All logic, analysis, and interactivity |
| Web Crypto API | Cryptographically secure password generation |
| Google Fonts | JetBrains Mono + Inter typefaces |

No frameworks, no libraries, no backend. Pure front-end development.

---

### Features Explained

**Real-Time Password Analysis**
As the user types, the app instantly evaluates the password and updates all visual indicators without any delay or page reload. This is achieved using JavaScript's input event listener which fires on every keystroke.

**Entropy-Based Scoring**
The app calculates password entropy using the formula:

```
H = L × log₂(N)
```

Where H is entropy in bits, L is the password length, and N is the size of the character pool (how many possible characters could appear at each position). Higher entropy means more possible combinations, which means harder to crack.

**Character Pool Detection**
The app detects which character classes are present in the password — lowercase letters (pool of 26), uppercase letters (pool of 26), digits (pool of 10), and special characters (pool of 32). The total pool size directly affects the entropy score.

**Crack Time Estimation**
Using the entropy score, the app estimates how long it would take to brute-force the password assuming an attacker uses a modern GPU running 10 billion guesses per second. Results range from "less than 1 second" to "over 1 million years", giving users a real sense of practical security.

**Strength Categories**
Passwords are classified into five levels based on both length and character diversity:
- Very Weak — short, single character type
- Weak — under 8 characters or very limited diversity
- Medium — 8 to 11 characters with some diversity
- Strong — 12 to 15 characters with good diversity
- Very Strong — 16 or more characters with full diversity

**Visual Strength Bar**
A color-coded progress bar gives instant visual feedback. The bar animates smoothly and changes color from red through orange, yellow, green, and cyan as the password gets stronger. A moving scanline effect inside the bar reinforces the cybersecurity aesthetic.

**Requirements Checklist**
Five checkboxes show whether the password meets each security requirement — minimum length, uppercase, lowercase, numbers, and special characters. Each check turns green with a tick when the requirement is met.

**Smart Recommendations**
The app generates specific, actionable advice based on exactly what the password is missing. It also detects dangerous patterns like repeated characters, keyboard sequences (qwerty, 123), and common words (password, admin, welcome) that appear in dictionary attack lists.

**Cryptographically Secure Password Generator**
The generate button creates a 20-character random password using window.crypto.getRandomValues — the same API used by browsers for cryptographic operations. It guarantees at least one character from each required class, then shuffles using Fisher-Yates algorithm to eliminate any positional bias.

**Show/Hide Toggle**
Users can reveal or mask their password with a single tap, making it easier to verify what they've typed without compromising security in public spaces.

**Copy to Clipboard**
One-tap copying with a fallback method for older browsers that don't support the modern Clipboard API.

**Dark / Light Mode**
Full theme switching with user preference saved to localStorage so the chosen theme persists across visits.

**Responsive Design**
The layout adapts cleanly to mobile phones, tablets, and desktop screens using CSS Grid and flexible units. Tested across multiple viewport sizes.

**Accessibility**
Built with ARIA labels, live regions for screen readers, visible keyboard focus indicators, and reduced-motion support for users with vestibular disorders.

---

### Security Concepts Demonstrated

This project demonstrates practical understanding of the following cybersecurity principles:

**Defense in Depth** — Multiple layers of analysis (length, diversity, patterns, entropy) rather than a single pass/fail check.

**Entropy & Randomness** — Understanding that true security comes from unpredictability, not just complexity. A long random password beats a short "clever" one every time.

**Threat Modeling** — The crack-time estimate is based on a realistic attacker model: a modern GPU cracking offline hashes at 10 billion attempts per second, which reflects real-world attack scenarios.

**Zero Data Exposure** — By design, no password ever leaves the device. There is no API call, no logging, no analytics. Privacy is built in at the architecture level, not added on top.

**Dictionary Attack Awareness** — The pattern detection warns users against passwords that appear in common wordlists, which are the first passwords tried in real attacks.

**Cryptographic Randomness** — The generator uses the Web Crypto API instead of Math.random, because Math.random is not cryptographically secure and should never be used to generate passwords or keys.

---

### What I Learned

Building this project deepened my understanding of how password security actually works at a mathematical level. I learned how entropy quantifies unpredictability, how character pools affect the search space an attacker must explore, and how even small changes in password length have an exponential effect on crack time. I also learned how to use the Web Crypto API for secure random number generation and how to build a fully accessible, responsive web application using only standard web technologies.


---

*Built with HTML, CSS, and Vanilla JavaScript. No frameworks. No data collection. No compromise.*# PASSGAURD
Password Strength Analyzer
