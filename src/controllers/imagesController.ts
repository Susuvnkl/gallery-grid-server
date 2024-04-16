import { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface Image {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  fullHDURL: string;
  imageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

interface PixabayResponse {
  totalHits: number;
  hits: Image[];
}

// Constants for cache management
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const cache: { [key: string]: { data: Image[]; currentPage: number; fetchedUntilPage: number } } =
  {};

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const IMAGES_PER_PAGE = 50; // Images fetched from Pixabay per API call
const IMAGES_PER_CLIENT_REQUEST = 9; // Images served to the client per request

const getImages = async (req: Request, res: Response): Promise<void> => {
  const category: string = req.query.category as string;
  const clientPage: number = parseInt(req.query.page as string) || 1;

  try {
    const categoryCache = cache[category];
    const startIndex = (clientPage - 1) * IMAGES_PER_CLIENT_REQUEST;
    const endIndex = startIndex + IMAGES_PER_CLIENT_REQUEST;

    // Check if the cache exists and has enough data to fulfill the request
    if (categoryCache && startIndex < categoryCache.data.length) {
      if (endIndex >= categoryCache.data.length - 5) {
        // Check if we need to prefetch the next batch
        prefetchImages(category, categoryCache.fetchedUntilPage + 1);
      }
      res.json(categoryCache.data.slice(startIndex, endIndex));
      return;
    }

    // Fetch new data if cache is insufficient
    await fetchImagesFromPixabay(category, 1);
    res.json(cache[category].data.slice(startIndex, endIndex));
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).send("Server Error");
  }
};

const fetchImagesFromPixabay = async (category: string, page: number): Promise<void> => {
  const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
    category
  )}&per_page=${IMAGES_PER_PAGE}&page=${page}&order=date`;
  const response = await axios.get<PixabayResponse>(url);
  console.log(response.data);
  const newData = response.data.hits;

  if (cache[category]) {
    cache[category].data.push(...newData);
    cache[category].fetchedUntilPage = page;
  } else {
    cache[category] = { data: newData, currentPage: page, fetchedUntilPage: page };
  }
};

const prefetchImages = (category: string, nextPage: number) => {
  fetchImagesFromPixabay(category, nextPage);
};

const clearStaleCache = () => {
  const now = Date.now();
  Object.keys(cache).forEach((key) => {
    // Check if the last fetched time + expiration time is less than current time
    if (now - cache[key].fetchedUntilPage * CACHE_EXPIRATION_MS > CACHE_EXPIRATION_MS) {
      delete cache[key];
      console.log(`Cleared stale cache for category: ${key}`);
    }
  });
};
const getSortedImages = async (req: Request, res: Response): Promise<void> => {
  const category: string = req.query.category as string;
  const sortBy: string = (req.query.sortBy as string) || "id"; // Default to sorting by 'id'

  try {
    // Ensure the cache has current data for this category
    if (!cache[category] || cache[category].data.length === 0) {
      await fetchImagesFromPixabay(category, 1);
    }

    // Get data from cache
    let images = cache[category].data;

    // Sort the images based on the sortBy parameter
    images.sort((a, b) => {
      if (sortBy === "id") {
        return a.id - b.id; // Ascending sort by 'id'
      } else if (sortBy === "views") {
        return b.views - a.views; // Descending sort by 'views'
      }
      return 0;
    });

    res.json(images.slice(0, IMAGES_PER_CLIENT_REQUEST)); // Return only the first set per client request
  } catch (error) {
    console.error("Error fetching sorted images:", error);
    res.status(500).send("Server Error");
  }
};

export { getImages, clearStaleCache, CLEANUP_INTERVAL_MS, getSortedImages };
