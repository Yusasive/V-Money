import { useCallback } from "react";
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const useContent = (section) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/content/${section}`);
      setContent(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch content");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    if (section) {
      fetchContent();
    }
  }, [section, fetchContent]);

  return { content, loading, error, refetch: fetchContent };
};

export const useAllContent = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/content`);
        const contentMap = {};
        response.data.forEach((item) => {
          contentMap[item.section] = item;
        });
        setContent(contentMap);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch content");
      } finally {
        setLoading(false);
      }
    };

    fetchAllContent();
  }, []);

  return { content, loading, error };
};
