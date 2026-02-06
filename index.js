// index.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { fetchCompanyLogo } = require('./app');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Company Scraper API',
      version: '2.0.0',
      description: 'A RESTful API service that automatically detects and extracts company logos and social media profiles from any website URL.',
      contact: {
        name: 'Yessine Ben Jemaa',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./index.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * @swagger
 * /logo:
 *   get:
 *     summary: Get company logo and social profiles (GET)
 *     description: Fetch company logo and social media profiles from a website URL using GET method
 *     tags: [Logo]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: The target website URL to scrape
 *         example: https://example.com
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoResponse'
 *       400:
 *         description: Bad request - empty URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: False
 */
app.get('/logo', async (req, res) => {
  const url = req.query.url;

  if (!url || !String(url).trim()) {
    // Empty URL => "False"
    return res.status(400).json({
      success: false,
      message: 'False'
    });
  }

  const result = await fetchCompanyLogo(url);
  return res.status(200).json(serializeResult(result));
});

/**
 * @swagger
 * /logo:
 *   post:
 *     summary: Get company logo and social profiles (POST)
 *     description: Fetch company logo and social media profiles from a website URL using POST method
 *     tags: [Logo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: The target website URL to scrape
 *                 example: https://example.com
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoResponse'
 *       400:
 *         description: Bad request - empty URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: False
 */
app.post('/logo', async (req, res) => {
  const url = req.body.url;

  if (!url || !String(url).trim()) {
    return res.status(400).json({
      success: false,
      message: 'False'
    });
  }

  const result = await fetchCompanyLogo(url);
  return res.status(200).json(serializeResult(result));
});

// Convert Buffer -> base64 so JSON is clean
function serializeResult(result) {
  if (result && result.success && result.logo && result.logo.data) {
    return {
      ...result,
      logo: {
        ...result.logo,
        // Base64 string of the image, if you need it
        data: result.logo.data.toString('base64')
      }
    };
  }
  return result;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     LogoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the logo was successfully found
 *           example: true
 *         message:
 *           type: string
 *           description: Status message describing the result
 *           example: OK
 *         logo:
 *           type: object
 *           description: Logo object (only present if success is true)
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               description: Original URL of the logo image
 *               example: https://example.com/images/logo.png
 *             size:
 *               type: integer
 *               description: Size of the image in bytes
 *               example: 45678
 *             contentType:
 *               type: string
 *               description: MIME type of the image
 *               example: image/png
 *             data:
 *               type: string
 *               format: byte
 *               description: Base64-encoded image data
 *               example: iVBORw0KGgoAAAANSUhEUgAA...
 *         socialProfiles:
 *           $ref: '#/components/schemas/SocialProfiles'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *           example: could not identify logo
 *         socialProfiles:
 *           $ref: '#/components/schemas/SocialProfiles'
 *     SocialProfiles:
 *       type: object
 *       properties:
 *         facebook:
 *           type: string
 *           nullable: true
 *           format: uri
 *           example: https://facebook.com/example
 *         linkedin:
 *           type: string
 *           nullable: true
 *           format: uri
 *           example: https://linkedin.com/company/example
 *         twitter:
 *           type: string
 *           nullable: true
 *           format: uri
 *           example: https://twitter.com/example
 *         youtube:
 *           type: string
 *           nullable: true
 *           format: uri
 *           example: https://youtube.com/@example
 *         discord:
 *           type: string
 *           nullable: true
 *           format: uri
 *         instagram:
 *           type: string
 *           nullable: true
 *           format: uri
 *           example: https://instagram.com/example
 *         pinterest:
 *           type: string
 *           nullable: true
 *           format: uri
 *         snapchat:
 *           type: string
 *           nullable: true
 *           format: uri
 *         tiktok:
 *           type: string
 *           nullable: true
 *           format: uri
 */

app.listen(PORT, () => {
  console.log(`Company Scraper API listening on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});