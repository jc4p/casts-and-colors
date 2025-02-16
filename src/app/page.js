'use client';

import { useState } from 'react';
import Image from "next/image";
import styles from "./page.module.css";
import { mintColor } from '@/lib/frame';

export default function Home() {
  const [color, setColor] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minting, setMinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);

  const handleFindColor = async () => {
    try {
      setLoading(true);
      setError(null);
      setColor(null);
      setExplanation(null);
      setShareUrl(null);
      
      // @ts-ignore
      const userFid = window.userFid;
      if (!userFid) {
        throw new Error('No FID found. Please make sure you are connected.');
      }

      const response = await fetch(`/api/get-color?fid=${userFid}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Response:', data);
      if (data.color) {
        setColor(data.color);
        setExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Error fetching color:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    try {
      setMinting(true);
      setError(null);
      await mintColor(color);
    } catch (error) {
      console.error('Error minting:', error);
      setError(error.message);
    } finally {
      setMinting(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      setError(null);
      
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color }),
      });

      const data = await response.json();

      console.log('Share url:', data);

      
      if (data.error) {
        throw new Error(data.error);
      }

      setShareUrl(data.imageUrl);
    } catch (error) {
      console.error('Error sharing:', error);
      setError(error.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="container">
      <div className="content">
        <button 
          className="find-color-button"
          onClick={handleFindColor}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Find Your Color'}
        </button>
        {error && (
          <p className="error-message">{error}</p>
        )}
        {color && (
          <div className="color-result">
            <div 
              className="color-preview"
              style={{ backgroundColor: color }}
            />
            <p className="color-code">{color}</p>
            <button
              className="mint-button"
              onClick={handleMint}
              disabled={minting}
              style={{ 
                backgroundColor: color,
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {minting ? 'Minting...' : 'Mint Your Color'}
            </button>
            <button
              className="share-button"
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing ? 'Generating Share Image...' : 'Share Your Color'}
            </button>
            {shareUrl && (
              <div className="share-result">
                <p>Share your color using this link:</p>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="share-link">
                  {shareUrl}
                </a>
              </div>
            )}
            {explanation && (
              <p className="color-explanation">{explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
