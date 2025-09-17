#!/usr/bin/env python3
"""
Startup script for the Video Editor API server
"""

import subprocess
import sys
import os
from pathlib import Path


def check_python_version():
    """Check if Python version is 3.8 or higher"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version}")


def check_ffmpeg():
    """Check if ffmpeg is installed"""
    try:
        result = subprocess.run(['ffmpeg', '-version'],
                                capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ ffmpeg is installed")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    print("❌ ffmpeg is not installed or not in PATH")
    print("Please install ffmpeg:")
    print("  - Windows: https://ffmpeg.org/download.html")
    print("  - macOS: brew install ffmpeg")
    print("  - Linux: sudo apt-get install ffmpeg")
    return False


def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'],
                       check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False


def create_directories():
    """Create necessary directories"""
    directories = ['uploads', 'outputs', 'temp']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
    print("✅ Directories created")


def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting Video Editor API server...")
    print("Server will be available at: http://localhost:8000")
    print("API documentation: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")

    try:
        subprocess.run([sys.executable, '-m', 'uvicorn', 'main:app',
                       '--reload', '--host', '0.0.0.0', '--port', '8000'])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")


def main():
    """Main function"""
    print("🎬 Video Editor API Setup")
    print("=" * 30)

    # Check prerequisites
    check_python_version()

    if not check_ffmpeg():
        print("\n⚠️  Warning: ffmpeg not found. Video processing will fail.")
        response = input("Continue anyway? (y/N): ").lower()
        if response != 'y':
            sys.exit(1)

    # Create directories
    create_directories()

    # Install dependencies
    if not install_dependencies():
        sys.exit(1)

    print("\n" + "=" * 30)
    print("✅ Setup complete!")
    print("=" * 30)

    # Start server
    start_server()


if __name__ == "__main__":
    main()
