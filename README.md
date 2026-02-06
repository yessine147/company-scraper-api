# Company Scraper API

A RESTful API service that automatically detects and extracts company logos and social media profiles from any website URL. The service uses intelligent image scoring algorithms to identify logos and returns data directly in the API response.

## Features

- 🎯 **Smart Logo Detection**: Automatically identifies company logos from websites using intelligent scoring algorithms
- 📱 **Social Media Extraction**: Extracts social media profile links (Facebook, LinkedIn, Twitter, YouTube, Discord, Instagram, Pinterest, Snapchat, TikTok)
- 🚀 **RESTful API**: Simple GET and POST endpoints for easy integration
- 🐳 **Docker Support**: Containerized deployment ready
- ✅ **Image Validation**: Validates image format (JPEG/PNG only) and size (max 2MB)
- 🔄 **Automatic Retry**: Falls back to alternative logo candidates if primary detection fails
- ⚡ **No Database Required**: Returns data directly in the response - no caching or database setup needed

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Response Format](#response-format)
- [Usage Examples](#usage-examples)
- [Docker Deployment](#docker-deployment)
- [Error Handling](#error-handling)
- [Technical Details](#technical-details)

## Installation

### Prerequisites

- Node.js 22+ (LTS recommended)
- npm or yarn

### Setup Steps

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd api-web-scraper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional):
   Create a `.env` file in the root directory if you want to customize the port:
   ```env
   PORT=3000
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

   The API will be available at `http://localhost:3000`

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | API server port | No | 3000 |

### Logo Detection Settings

- **Maximum Logo Size**: 2 MB (hardcoded)
- **Supported Formats**: JPEG, JPG, PNG only

## API Endpoints

### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok"
}
```

### Get Logo (GET)

**GET** `/logo?url=<target_url>`

Fetch company logo and social profiles from a website URL.

**Query Parameters:**
- `url` (required): The target website URL to scrape

**Example:**
```bash
curl "http://localhost:3000/logo?url=https://example.com"
```

### Get Logo (POST)

**POST** `/logo`

Fetch company logo and social profiles from a website URL using POST method.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/logo \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "OK",
  "logo": {
    "url": "https://example.com/images/logo.png",
    "size": 45678,
    "contentType": "image/png",
    "data": "iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "socialProfiles": {
    "facebook": "https://facebook.com/example",
    "linkedin": "https://linkedin.com/company/example",
    "twitter": "https://twitter.com/example",
    "youtube": "https://youtube.com/@example",
    "discord": null,
    "instagram": "https://instagram.com/example",
    "pinterest": null,
    "snapchat": null,
    "tiktok": null
  }
}
```

### Error Responses

**Empty URL:**
```json
{
  "success": false,
  "message": "False"
}
```
Status Code: `400`

**Malformed URL:**
```json
{
  "success": false,
  "message": "Malformed URL"
}
```
Status Code: `200`

**Logo Not Found:**
```json
{
  "success": false,
  "message": "could not identify logo",
  "socialProfiles": {
    "facebook": null,
    "linkedin": null,
    "twitter": null,
    "youtube": null,
    "discord": null,
    "instagram": null,
    "pinterest": null,
    "snapchat": null,
    "tiktok": null
  }
}
```
Status Code: `200`

**Logo Too Large:**
```json
{
  "success": false,
  "message": "logo greater than image limit",
  "socialProfiles": {
    "facebook": null,
    "linkedin": null,
    "twitter": null,
    "youtube": null,
    "discord": null,
    "instagram": null,
    "pinterest": null,
    "snapchat": null,
    "tiktok": null
  }
}
```
Status Code: `200`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the logo was successfully found |
| `message` | string | Status message describing the result |
| `logo` | object | Logo object (only present if `success` is true) |
| `logo.url` | string | Original URL of the logo image |
| `logo.size` | number | Size of the image in bytes |
| `logo.contentType` | string | MIME type of the image (image/jpeg or image/png) |
| `logo.data` | string | Base64-encoded image data |
| `socialProfiles` | object | Object containing social media profile URLs |
| `socialProfiles.facebook` | string\|null | Facebook profile URL |
| `socialProfiles.linkedin` | string\|null | LinkedIn profile URL |
| `socialProfiles.twitter` | string\|null | Twitter/X profile URL |
| `socialProfiles.youtube` | string\|null | YouTube channel/profile URL |
| `socialProfiles.discord` | string\|null | Discord server/profile URL |
| `socialProfiles.instagram` | string\|null | Instagram profile URL |
| `socialProfiles.pinterest` | string\|null | Pinterest profile URL |
| `socialProfiles.snapchat` | string\|null | Snapchat profile URL |
| `socialProfiles.tiktok` | string\|null | TikTok profile URL |

## Usage Examples

### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

async function getLogo(url) {
  const response = await fetch(`http://localhost:3000/logo?url=${encodeURIComponent(url)}`);
  const data = await response.json();
  
  if (data.success) {
    console.log('Logo found:', data.logo.url);
    console.log('Logo size:', data.logo.size, 'bytes');
    console.log('Social profiles:', data.socialProfiles);
    
    // Decode base64 image if needed
    const imageBuffer = Buffer.from(data.logo.data, 'base64');
    // Save or use the image buffer
  } else {
    console.log('Error:', data.message);
  }
  
  return data;
}

getLogo('https://example.com');
```

### Python

```python
import requests
import base64

def get_logo(url):
    response = requests.get('http://localhost:3000/logo', params={'url': url})
    data = response.json()
    
    if data['success']:
        print(f"Logo found: {data['logo']['url']}")
        print(f"Logo size: {data['logo']['size']} bytes")
        
        # Decode base64 image if needed
        image_data = base64.b64decode(data['logo']['data'])
        with open('logo.png', 'wb') as f:
            f.write(image_data)
            
        print('Social profiles:', data['socialProfiles'])
    else:
        print(f"Error: {data['message']}")
    
    return data

get_logo('https://example.com')
```

### cURL

```bash
# GET request
curl "http://localhost:3000/logo?url=https://example.com"

# POST request
curl -X POST http://localhost:3000/logo \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Docker Deployment

### Build the Docker Image

```bash
docker build -t api-web-scraper .
```

### Run the Container

```bash
docker run -d \
  --name web-scraper-api \
  -p 3000:3000 \
  -e PORT=3000 \
  api-web-scraper
```

### Docker Compose Example

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
```

Then run:
```bash
docker-compose up -d
```

## Error Handling

The API handles various error scenarios:

1. **Empty URL**: Returns `400 Bad Request` with message "False"
2. **Malformed URL**: Returns `200 OK` with `success: false` and message "Malformed URL"
3. **Network Errors**: Returns `200 OK` with `success: false` and message "could not identify logo"
4. **Logo Too Large**: Returns `200 OK` with `success: false` and message "logo greater than image limit"
5. **Unsupported Image Format**: Tries next candidate logo
6. **Website Unreachable**: Returns `200 OK` with `success: false` and message "could not identify logo"

## Technical Details

### Logo Detection Algorithm

The service uses a scoring system to identify the most likely logo:

1. **Image Collection**: Scans all `<img>` tags on the page
2. **Filtering**: Only considers JPEG/JPG/PNG images (excludes data URLs)
3. **Scoring**: Assigns points based on:
   - Contains "logo" in src/alt/id/class: +10 points
   - Contains "brand": +4 points
   - Contains "header" or "navbar": +2 points
   - Contains "site" or "main": +1 point
   - Path contains "/logo.": +5 points
4. **Validation**: Downloads and validates each candidate (format, size)
5. **Selection**: Returns the first valid logo that passes all checks

### Social Media Detection

The service scans all `<a>` tags on the page and matches href attributes against known social media domains:

- **Facebook**: facebook.com
- **LinkedIn**: linkedin.com
- **Twitter/X**: twitter.com, x.com
- **YouTube**: youtube.com, youtu.be
- **Discord**: discord.com
- **Instagram**: instagram.com
- **Pinterest**: pinterest.com
- **Snapchat**: snapchat.com
- **TikTok**: tiktok.com

Only the first matching link for each platform is returned.

### Performance Considerations

- **Image size limit**: 2MB maximum to prevent memory issues
- **Base64 encoding**: Logo data is base64-encoded in JSON responses for compatibility
- **Redirect following**: Automatically follows HTTP redirects
- **No caching**: Each request fetches fresh data from the target website

## Limitations

- **Image Formats**: Only JPEG and PNG are supported
- **Image Size**: Maximum 2MB per logo
- **No Caching**: Each request fetches data fresh from the target website (no database or cache)
- **Social Media**: Only detects links in `<a>` tags, not meta tags
- **Rate Limiting**: Not implemented (consider adding for production)
- **Authentication**: No authentication/authorization (consider adding for production)

## Version

Current version: **2.0.0**

## Support

For issues, questions, or contributions, please contact the development team.
