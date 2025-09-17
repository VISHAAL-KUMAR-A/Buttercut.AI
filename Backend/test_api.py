#!/usr/bin/env python3
"""
Simple test script to verify the Video Editor API is working
"""

import requests
import time
import json
import os
from pathlib import Path

BASE_URL = "http://localhost:8000"


def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
        return False


def test_upload_endpoint():
    """Test the upload endpoint with sample data"""
    print("\n🔍 Testing upload endpoint...")

    # Sample overlay data
    overlays = [
        {
            "type": "text",
            "content": "Test Overlay",
            "x": 0.1,
            "y": 0.1,
            "start_time": 1.0,
            "end_time": 3.0,
            "font_size": 24,
            "font_color": "white"
        }
    ]

    try:
        # Create a dummy file for testing (if no real video available)
        dummy_file_content = b"dummy video content for testing"

        files = {"video": ("test_video.mp4", dummy_file_content, "video/mp4")}
        data = {"overlays": json.dumps(overlays)}

        response = requests.post(f"{BASE_URL}/upload", files=files, data=data)

        if response.status_code == 200:
            result = response.json()
            print("✅ Upload endpoint works")
            print(f"   Job ID: {result.get('job_id')}")
            return result.get('job_id')
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Upload test failed: {e}")
        return None


def test_status_endpoint(job_id):
    """Test the status endpoint"""
    if not job_id:
        print("⏭️  Skipping status test (no job ID)")
        return

    print(f"\n🔍 Testing status endpoint for job: {job_id}")
    try:
        response = requests.get(f"{BASE_URL}/status/{job_id}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Status endpoint works")
            print(f"   Status: {result.get('status')}")
            print(f"   Progress: {result.get('progress')}%")
            print(f"   Message: {result.get('message')}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Status test failed: {e}")


def test_jobs_endpoint():
    """Test the jobs listing endpoint"""
    print("\n🔍 Testing jobs endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/jobs")
        if response.status_code == 200:
            result = response.json()
            print("✅ Jobs endpoint works")
            print(f"   Total jobs: {len(result)}")
            if result:
                for job_id, job_info in result.items():
                    print(f"   - {job_id}: {job_info.get('status')}")
        else:
            print(f"❌ Jobs listing failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Jobs test failed: {e}")


def main():
    """Run all tests"""
    print("🧪 Video Editor API Test Suite")
    print("=" * 40)

    # Test health check first
    if not test_health_check():
        print("\n❌ Server is not responding. Please start the server first:")
        print("   python start_server.py")
        return

    # Test upload endpoint
    job_id = test_upload_endpoint()

    # Test status endpoint
    test_status_endpoint(job_id)

    # Test jobs listing
    test_jobs_endpoint()

    print("\n" + "=" * 40)
    print("🎉 API tests completed!")
    print("\nNote: This is a basic connectivity test.")
    print("For full testing with real video files, use Postman with the provided collection.")


if __name__ == "__main__":
    main()
