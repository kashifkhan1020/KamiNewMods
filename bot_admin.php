<?php
// Telegram Bot Configuration
$BOT_TOKEN = "8177284955:AAG1XPR9bj138cHjau3idpc6xeJwPNtk-tA";
$ADMIN_USER_ID = "7104074002";
$WEBHOOK_URL = ""; // No webhook needed

// Get incoming update from Telegram
$update = json_decode(file_get_contents('php://input'), true);

// If no update from webhook, check manually
if (!$update) {
    // Manual check for testing
    if (isset($_GET['check'])) {
        $update = getLastUpdate();
    } else {
        die("Telegram Bot is Active! 🤖");
    }
}

if ($update) {
    processUpdate($update);
}

function processUpdate($update) {
    global $BOT_TOKEN, $ADMIN_USER_ID;
    
    $message = $update['message'] ?? null;
    if (!$message) return;
    
    $user_id = $message['from']['id'];
    $chat_id = $message['chat']['id'];
    $text = $message['text'] ?? '';
    $document = $message['document'] ?? null;
    
    // Check if user is admin
    if ($user_id != $ADMIN_USER_ID) {
        sendMessage($chat_id, "❌ Unauthorized access. You are not admin.");
        return;
    }
    
    // Handle /start command
    if ($text == '/start') {
        showMainMenu($chat_id);
    }
    // Handle menu options
    elseif ($text == '📤 Share Link') {
        askForLinkInfo($chat_id);
    }
    elseif ($text == '📎 Share File') {
        askForFile($chat_id);
    }
    // Handle link information
    elseif (strpos($text, 'http') === 0) {
        // This is a link, wait for description
        saveTempLink($chat_id, $text);
        askForDescription($chat_id);
    }
    // Handle file description
    elseif ($document) {
        handleFileUpload($chat_id, $document);
    }
    // Handle file info (description)
    elseif ($text && !in_array($text, ['📤 Share Link', '📎 Share File'])) {
        handleFileInfo($chat_id, $text);
    }
}

function showMainMenu($chat_id) {
    $menu = [
        'keyboard' => [
            ['📤 Share Link', '📎 Share File']
        ],
        'resize_keyboard' => true,
        'one_time_keyboard' => false
    ];
    
    sendMessage($chat_id, 
        "🤖 *Welcome to File Manager Bot!*\n\n" .
        "Choose an option:\n\n" .
        "📤 *Share Link* - Add download link\n" .
        "📎 *Share File* - Upload file directly\n\n" .
        "Your files will appear on the website automatically!",
        $menu
    );
}

function askForLinkInfo($chat_id) {
    sendMessage($chat_id, 
        "🔗 *Please send your download link:*\n\n" .
        "Example:\n" .
        "https://mediafire.com/file/abc123/file.apk\n" .
        "https://drive.google.com/file/xyz789\n\n" .
        "After sending link, I'll ask for file details."
    );
}

function askForFile($chat_id) {
    sendMessage($chat_id, 
        "📎 *Please upload your file:*\n\n" .
        "Supported types: APK, ZIP, PDF, TXT, etc.\n\n" .
        "After uploading, I'll ask for file details."
    );
}

function askForDescription($chat_id) {
    sendMessage($chat_id, 
        "📝 *Now send file details in this format:*\n\n" .
        "File Name | Category | Size\n\n" .
        "Example:\n" .
        "Free Fire Mod v2.1 | Games | 85 MB\n\n" .
        "Available categories:\n" .
        "APK, ZIP, Tools, Software, Games, Documents"
    );
}

function saveTempLink($chat_id, $link) {
    $temp_data = json_decode(file_get_contents('temp_data.json'), true) ?: [];
    $temp_data[$chat_id] = ['link' => $link, 'type' => 'link'];
    file_put_contents('temp_data.json', json_encode($temp_data));
}

function handleFileUpload($chat_id, $document) {
    global $BOT_TOKEN;
    
    $file_id = $document['file_id'];
    $file_name = $document['file_name'];
    $file_size = $document['file_size'];
    
    // Get file info from Telegram
    $file_info = json_decode(file_get_contents("https://api.telegram.org/bot{$BOT_TOKEN}/getFile?file_id={$file_id}"), true);
    
    if (!$file_info['ok']) {
        sendMessage($chat_id, "❌ Failed to get file info.");
        return;
    }
    
    $file_path = $file_info['result']['file_path'];
    $download_url = "https://api.telegram.org/file/bot{$BOT_TOKEN}/{$file_path}";
    
    // Create files directory
    if (!is_dir('files')) {
        mkdir('files', 0777, true);
    }
    
    // Download and save file
    $local_path = "files/" . $file_name;
    file_put_contents($local_path, file_get_contents($download_url));
    
    // Save temp data
    $temp_data = json_decode(file_get_contents('temp_data.json'), true) ?: [];
    $temp_data[$chat_id] = [
        'file_path' => $local_path,
        'file_name' => $file_name,
        'file_size' => $file_size,
        'type' => 'file'
    ];
    file_put_contents('temp_data.json', json_encode($temp_data));
    
    sendMessage($chat_id, 
        "✅ *File received!*\n\n" .
        "📁 Name: {$file_name}\n" .
        "💾 Size: " . formatBytes($file_size) . "\n\n" .
        "📝 *Now send file details:*\n\n" .
        "File Name | Category | Description\n\n" .
        "Example:\n" .
        "Free Fire Mod v2.1 | Games | Best mod for Free Fire"
    );
}

function handleFileInfo($chat_id, $text) {
    $temp_data = json_decode(file_get_contents('temp_data.json'), true) ?: [];
    $user_data = $temp_data[$chat_id] ?? null;
    
    if (!$user_data) {
        sendMessage($chat_id, "❌ No file/link found. Please start over.");
        return;
    }
    
    // Parse file info: "Name | Category | Size"
    $parts = array_map('trim', explode('|', $text));
    
    if (count($parts) < 3) {
        sendMessage($chat_id, "❌ Invalid format. Use: Name | Category | Size");
        return;
    }
    
    $name = $parts[0];
    $category = $parts[1];
    $size = $parts[2];
    
    if ($user_data['type'] == 'link') {
        $download_url = $user_data['link'];
        $file_name = basename($download_url);
        $file_size = $size;
    } else {
        $download_url = $user_data['file_path'];
        $file_name = $user_data['file_name'];
        $file_size = formatBytes($user_data['file_size']);
    }
    
    // Add to main database
    addFileToDatabase($name, $file_size, $download_url, $category, $file_name);
    
    // Clear temp data
    unset($temp_data[$chat_id]);
    file_put_contents('temp_data.json', json_encode($temp_data));
    
    sendMessage($chat_id, 
        "🎉 *File Added Successfully!*\n\n" .
        "📁 Name: {$name}\n" .
        "📦 Category: {$category}\n" .
        "💾 Size: {$file_size}\n\n" .
        "✅ File is now live on the website!\n" .
        "Users can download it immediately."
    );
    
    // Show main menu again
    showMainMenu($chat_id);
}

function addFileToDatabase($name, $size, $download_url, $category, $file_name) {
    $files = json_decode(file_get_contents('files.json'), true) ?: ['files' => []];
    
    $new_file = [
        'id' => uniqid(),
        'name' => $name,
        'size' => $size,
        'type' => pathinfo($file_name, PATHINFO_EXTENSION) ?: 'link',
        'download_url' => $download_url,
        'category' => $category,
        'date' => date('Y-m-d H:i:s')
    ];
    
    $files['files'][] = $new_file;
    file_put_contents('files.json', json_encode($files, JSON_PRETTY_PRINT));
}

function formatBytes($bytes, $precision = 2) {
    if (!is_numeric($bytes)) return $bytes;
    
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

function sendMessage($chat_id, $text, $reply_markup = null) {
    global $BOT_TOKEN;
    
    $url = "https://api.telegram.org/bot{$BOT_TOKEN}/sendMessage";
    $data = [
        'chat_id' => $chat_id,
        'text' => $text,
        'parse_mode' => 'Markdown'
    ];
    
    if ($reply_markup) {
        $data['reply_markup'] = json_encode($reply_markup);
    }
    
    file_get_contents($url . '?' . http_build_query($data));
}

function getLastUpdate() {
    global $BOT_TOKEN;
    $url = "https://api.telegram.org/bot{$BOT_TOKEN}/getUpdates";
    $response = file_get_contents($url);
    return json_decode($response, true);
}

// Initialize files
if (!file_exists('files.json')) {
    file_put_contents('files.json', json_encode(['files' => []]));
}

if (!file_exists('temp_data.json')) {
    file_put_contents('temp_data.json', json_encode([]));
}

if (!is_dir('files')) {
    mkdir('files', 0777, true);
}
?>
