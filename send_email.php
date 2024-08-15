<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize the email input
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

    // Validate the email
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Replace with the artist's email address
        $to = "sunilsawane52@gmail.com"; 
        $subject = "New Contact Request";
        $message = "You have a new contact request from: " . $email;
        $headers = "From: noreply@sunilartgallery.com"; // Replace with your website's email

        // Send the email
        if (mail($to, $subject, $message, $headers)) {
            echo "Email sent successfully!";
        } else {
            echo "Failed to send email.";
        }
    } else {
        echo "Invalid email address.";
    }
}
?>
