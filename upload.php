<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $uploadDir = 'files/';
    
    // Create files directory if not exists
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $fileName = basename($_FILES['file']['name']);
    $uploadFile = $uploadDir . $fileName;
    
    if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadFile)) {
        echo "✅ File uploaded successfully: " . $fileName;
    } else {
        echo "❌ File upload failed!";
    }
} else {
    echo "❌ No file selected!";
}
?>
