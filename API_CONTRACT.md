# API Contract (JSON Mainline)

This document freezes the current API contract for the JSON backend (`server-json.js`) as Day 1 baseline.

## Scope

- Runtime: `server-json.js`
- Base URL: `/api`
- Auth: JWT (`Authorization: Bearer <token>`)

## Auth

- `POST /api/auth/login` (public)
- Input: `username`, `password`
- Output: `success`, `token`, `user`

## Keywords

- `GET /api/keywords` (public)
- `POST /api/keywords` (auth)
- `PUT /api/keywords/:id` (auth)
- `DELETE /api/keywords/:id` (auth)
- `POST /api/keywords/batch` (auth)

## Daily News

- `GET /api/news` (public)
  - Query: `category`, `country`, `limit`, `offset`
- `GET /api/news/dates` (public)
- `GET /api/news/date/:date` (public)
  - Query: `category`, `country`
- `POST /api/news` (auth)
- `PUT /api/news/:id` (auth)
- `DELETE /api/news/:id` (auth)
- `POST /api/news/batch` (auth)

## Weekly News

- `GET /api/weekly-news` (public)
- `POST /api/weekly-news` (auth)
- `PUT /api/weekly-news/:id` (auth)
- `DELETE /api/weekly-news/:id` (auth)
- `POST /api/weekly-news/batch` (auth)
- `GET /api/weekly-news/template` (public)

## Tools

- `GET /api/tools` (public)
- `GET /api/tools/categories` (public)
- `GET /api/tools/:id` (public)
- `POST /api/tools` (auth)
- `PUT /api/tools/:id` (auth)
- `DELETE /api/tools/:id` (auth)
- `POST /api/tools/batch` (auth)
- `POST /api/tools/upload-logo` (auth)

## Visit / Security / Ops

- `POST /api/visit/track` (public)
- `GET /api/visit/province-stats` (auth)
- `GET /api/visit/logs` (auth)
- `DELETE /api/visit/logs/cleanup` (auth)
- `GET /api/banned-ips` (auth)
- `POST /api/banned-ips` (auth)
- `DELETE /api/banned-ips/:ip` (auth)
- `POST /api/banned-ips/cleanup` (auth)
- `GET /api/api-calls/stats` (auth)

## System / Data

- `GET /api/stats` (public)
- `GET /api/settings` (public)
- `POST /api/settings` (auth)
- `GET /api/backup` (auth)
- `POST /api/restore` (auth)

## Archive / Templates / Reports / AI

- `GET /api/archive/dates` (auth)
- `GET /api/archive/:date` (auth)
- `DELETE /api/archive/:date` (auth)
- `GET /api/news/template` (public)
- `POST /api/ai/chat` (public)
- `GET /api/reports` (public)
- `GET /api/reports/:filename` (public)

## Contract Notes

1. This contract is baseline-only; no behavior changes are allowed before route/service split.
2. If an endpoint is removed/renamed, update this file and add migration notes.
3. If auth policy changes, update both this file and `README.md`.
