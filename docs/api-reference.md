# API Reference — Campus Blockchain Chat

All endpoints are hosted at `http://localhost:4000`. Content type for requests is `application/json`.
Protected routes require the `Authorization` header with a valid bearer token.

## 🔐 Auth Endpoints

### 1. Get SIWE Nonce
Generates a unique cryptographic nonce to sign with MetaMask.
- **URL**: `/api/auth/nonce`
- **Method**: `POST`
- **Headers**: None
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "nonce": "X4f8G2ksJ9"
    }
  }
  ```

### 2. Verify SIWE Signature (Login)
Verifies the cryptographic signature of the SIWE message and issues a JWT token.
- **URL**: `/api/auth/verify`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "message": "campus-informatika.local wants you to sign in with your Ethereum account:\n0x71C7656EC7ab88b098defB751B7401B5f6d8976F\n...",
    "signature": "0x8bc0d9..."
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "clh123abc456",
        "walletAddress": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
        "nim": "10121001",
        "name": "Alex Benedict",
        "angkatan": 2021,
        "isVerified": true
      }
    }
  }
  ```

### 3. Register Student
Registers a student NIM and wallet address in the local database.
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "nim": "10121001",
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "name": "Alex Benedict",
    "angkatan": 2021
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "id": "clh123abc456",
      "walletAddress": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
      "nim": "10121001",
      "name": "Alex Benedict",
      "angkatan": 2021,
      "isVerified": false
    }
  }
  ```

### 4. Logout
- **URL**: `/api/auth/logout`
- **Method**: `DELETE`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 5. Get Current User Details
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": "clh123abc456",
      "walletAddress": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
      "nim": "10121001",
      "name": "Alex Benedict",
      "angkatan": 2021,
      "isVerified": true
    }
  }
  ```

---

## 📝 Posts (Q&A) Endpoints

### 1. List Posts (Paginated)
Supports optional tag and query filtering.
- **URL**: `/api/posts`
- **Method**: `GET`
- **Query Params**:
  - `page`: default `1`
  - `limit`: default `10`
  - `tag`: filter by specific tag
  - `search`: search query
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "posts": [
        {
          "id": "post123",
          "title": "Bagaimana cara deploy contract di Sepolia?",
          "body": "Saya sedang mencoba deploy ERC-20 contract...",
          "tags": ["solidity", "ethereum"],
          "author": {
            "id": "clh123abc456",
            "name": "Alex Benedict",
            "walletAddress": "0x71c7..."
          },
          "bestAnswer": null,
          "answersCount": 3,
          "commentsCount": 1,
          "likesCount": 5,
          "createdAt": "2026-06-15T08:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

### 2. Create Question (+5 CSIT reward)
- **URL**: `/api/posts`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>` (Must be whitelisted)
- **Body**:
  ```json
  {
    "title": "Bagaimana cara deploy contract di Sepolia?",
    "body": "Saya sedang mencoba deploy ERC-20 contract...",
    "tags": ["solidity", "ethereum"]
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "id": "post123",
      "title": "Bagaimana cara deploy contract di Sepolia?",
      "body": "Saya sedang mencoba deploy ERC-20 contract...",
      "tags": ["solidity", "ethereum"],
      "authorId": "clh123abc456"
    }
  }
  ```

### 3. Get Post Details
- **URL**: `/api/posts/:id`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "id": "post123",
      "title": "...",
      "body": "...",
      "author": { "id": "...", "name": "..." },
      "comments": [
        {
          "id": "comment456",
          "body": "Menarik sekali pertanyaannya",
          "author": { "name": "Budi" }
        }
      ],
      "answers": [
        {
          "id": "answer789",
          "body": "Kamu bisa menggunakan Hardhat...",
          "author": { "name": "Charlie" },
          "comments": [],
          "likesCount": 2,
          "isBest": false
        }
      ],
      "likesCount": 5
    }
  }
  ```

### 4. Answer Question (+10 CSIT reward)
- **URL**: `/api/posts/:id/answers`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "body": "Kamu bisa menggunakan Hardhat dengan konfigurasi Sepolia RPC URL di hardhat.config.ts..."
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "id": "answer789",
      "body": "...",
      "postId": "post123",
      "authorId": "clh789..."
    }
  }
  ```

### 5. Pick Best Answer (+20 CSIT reward to author of answer)
Only callable by the author of the post.
- **URL**: `/api/posts/:id/best`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "answerId": "answer789"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Best answer selected successfully"
  }
  ```

### 6. Toggle Like Post (+2 CSIT reward to author of post)
- **URL**: `/api/posts/:id/like`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "liked": true
    }
  }
  ```

### 7. Share Post (+1 CSIT reward to author of post)
- **URL**: `/api/posts/:id/share`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Post shared successfully"
  }
  ```

---

## 💬 Comments Endpoints

### 1. Create Comment (+1 CSIT reward)
Adds a comment to a Post OR an Answer.
- **URL**: `/api/comments`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "body": "Terima kasih infonya!",
    "postId": "post123"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "id": "comment555",
      "body": "Terima kasih infonya!",
      "postId": "post123",
      "authorId": "user111"
    }
  }
  ```

### 2. Delete Comment
- **URL**: `/api/comments/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```

### 3. Toggle Like Comment
- **URL**: `/api/comments/:id/like`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "liked": true,
      "likesCount": 4
    }
  }
  ```

---

## 🏆 Rewards Endpoints

### 1. Fetch CSIT Balances
Reads both the claimed balance (on-chain ERC-20 token) and unclaimed rewards accumulated.
- **URL**: `/api/rewards/balance`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "onChain": "15000000000000000000",
      "unclaimed": "5000000000000000000",
      "onChainFormatted": 15,
      "unclaimedFormatted": 5
    }
  }
  ```

### 2. Reward History Logs
Fetches history of reward allocations logged in the DB.
- **URL**: `/api/rewards/history`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "history1",
        "userId": "clh123",
        "action": "PostQuestion",
        "amount": 5,
        "txHash": "0x5c42...",
        "contentId": "post123",
        "createdAt": "2026-06-15T08:00:00Z"
      }
    ]
  }
  ```

### 3. Daily Action Statistics
Reads daily limits status from the blockchain to prevent exceeding caps.
- **URL**: `/api/rewards/daily-stats`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "postQuestionCount": 1,
      "postAnswerCount": 0,
      "receiveLikeCount": 2,
      "postCommentCount": 1,
      "sharePostCount": 0
    }
  }
  ```

---

## 📊 Leaderboard Endpoints

### 1. All-time Leaderboard (By On-chain Balance)
- **URL**: `/api/leaderboard`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "clh123",
        "name": "Alex Benedict",
        "nim": "10121001",
        "angkatan": 2021,
        "walletAddress": "0x71c765...",
        "balance": "15000000000000000000",
        "balanceFormatted": 15
      }
    ]
  }
  ```

### 2. Weekly Leaderboard (By last 7 days points)
- **URL**: `/api/leaderboard/weekly`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "clh123",
        "name": "Alex Benedict",
        "nim": "10121001",
        "angkatan": 2021,
        "walletAddress": "0x71c765...",
        "weeklyPoints": 15
      }
    ]
  }
  ```

---

## 🛡️ Admin Endpoints
Authorized requests require bearer token belonging to the administrator wallet (the deployer private key address).

### 1. Add to Whitelist on-chain
- **URL**: `/api/admin/whitelist`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "nim": "10121001"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "walletAddress": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
      "nim": "10121001",
      "txHash": "0x12a3f..."
    }
  }
  ```

### 2. Remove from Whitelist
- **URL**: `/api/admin/whitelist/:nim`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "nim": "10121001",
      "walletAddress": "0x71c765...",
      "txHash": "0x55ab..."
    }
  }
  ```

### 3. List Registered Students
- **URL**: `/api/admin/students`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "clh123",
        "walletAddress": "0x71c765...",
        "nim": "10121001",
        "name": "Alex Benedict",
        "angkatan": 2021,
        "isVerified": true,
        "createdAt": "2026-06-15T08:00:00Z"
      }
    ]
  }
  ```

### 4. Platform Statistics
- **URL**: `/api/admin/stats`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "totalUsers": 12,
      "totalPosts": 30,
      "totalAnswers": 45,
      "totalComments": 18,
      "totalRewardsCount": 93,
      "totalTokensDistributed": 420
    }
  }
  ```
