# AI Fashion Recommendation System

An AI-powered fashion recommendation system based on skin tone, body measurements, and occasion.

## Features

- Skin tone detection using SAM (Segment Anything Model)
- Body measurements analysis using SAIA Perfect Fit API
- Personalized clothing recommendations
- (Optional) AR "try on" feature

## Project Structure

```
fashion-recommendation-system/
├── frontend/                 # Next.js frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Next.js pages
│   │   ├── styles/           # CSS styles
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── contexts/         # React contexts
│   ├── package.json
│   └── tsconfig.json
│   
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Core functionality
│   │   ├── models/           # Data models
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

## Technologies Used

### Backend
- Python 3.9+
- FastAPI
- MongoDB (with Motor for async)
- OpenCV for image processing
- SAM (Segment Anything Model) by Meta for face segmentation
- SAIA Perfect Fit API for body measurements

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- React Webcam
- Axios for API requests

## Setup

### Prerequisites
- Node.js 16+
- Python 3.9+
- MongoDB
- (Optional) CUDA-enabled GPU for SAM model

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Download the SAM checkpoint:
   ```bash
   mkdir -p checkpoints
   cd checkpoints
   # Download from https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth
   ```

5. Set environment variables:
   ```bash
   export MONGO_URI="mongodb://localhost:27017"
   export SAIA_API_KEY="your_saia_api_key"
   export SAM_CHECKPOINT="checkpoints/sam_vit_h_4b8939.pth"
   ```

6. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Web Workflow

1. User visits the home page and clicks "Try Me" button
2. User chooses between "Login as Guest" or "Login as Member"
   - If "Login as Member" is selected, user fills out a form with name, age, and occasion
3. AI analyzes user's face to detect skin tone using image segmentation
4. AI analyzes body measurements using SAIA Perfect Fit API
5. Results page displays detected skin tone and clothing size
6. Recommendation page shows personalized clothing suggestions

## API Endpoints

- `GET /` - Root endpoint to check if API is running
- `POST /users/` - Create a new user profile
- `POST /skin-tone/` - Detect skin tone from uploaded image
- `POST /body-measurements/` - Get body measurements from uploaded image
- `GET /recommendations/` - Get clothing recommendations based on skin tone, occasion, and size

## Future Enhancements

- Implement AR try-on feature
- Add user authentication
- Expand clothing database
- Improve recommendation algorithm
- Add favorite/save feature for recommendations

## License

This project is licensed under the MIT License - see the LICENSE file for details.