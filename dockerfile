# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY backend.py .
COPY model.py .

# Create the directory for uploaded PDFs
RUN mkdir -p uploaded_pdfs

# --- NEW: Copy static files ---
# Create the static directory in the container
RUN mkdir -p static

# Copy all contents of your local 'static' directory into the container's '/app/static'
COPY static/ static/
# --- END NEW ---

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run the Uvicorn server when the container launches
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "8000"]