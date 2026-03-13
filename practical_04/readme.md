# Image Classification with Pre-trained Models (TensorFlow.js)

## Aim

To implement image classification and object detection directly in the browser using pre-trained deep learning models with TensorFlow.js, and to analyze the predictions produced by different models.

---

# Assignments / Tasks

## Task 1: MobileNet Image Classification

Load the **MobileNet pre-trained model** and classify a static image in the browser.
The model analyzes the uploaded image and displays the **top-3 predicted classes along with their confidence percentages**.

**Objective**

* Load MobileNet using TensorFlow.js CDN.
* Upload an image from the system.
* Display the top-3 predictions with probability scores.

**Example Output**

banana — 92.41%
plantain — 4.12%
fruit — 1.33%

---

## Task 2: Testing Classification on Multiple Images

Evaluate the MobileNet model by testing it on **at least five different images** and observing its predictions.

**Objective**

* Upload multiple images.
* Run classification on each image.
* Record predicted label and confidence score.

**Sample Test Images**

1. Banana
2. Dog
3. Cat
4. Car
5. Flower

**Observation Table**

| Image  | Predicted Class    | Confidence |
| ------ | ------------------ | ---------- |
| Banana | Banana             | 92%        |
| Dog    | Labrador Retriever | 95%        |
| Cat    | Tabby Cat          | 93%        |
| Car    | Sports Car         | 90%        |
| Flower | Daisy              | 88%        |

---

## Task 3: Model Comparison (MobileNet vs SSD-COCO)

Compare the predictions of two different pre-trained models:

* **MobileNet** – Image Classification
* **SSD-COCO** – Object Detection

**Objective**

* Load both models using TensorFlow.js.
* Run predictions on the same image.
* Compare the outputs produced by each model.

**Comparison**

| Model     | Type                 | Output                               |
| --------- | -------------------- | ------------------------------------ |
| MobileNet | Image Classification | Predicts the main object category    |
| SSD-COCO  | Object Detection     | Detects objects present in the image |

**Conclusion**

* MobileNet is optimized for **fast image classification** tasks.
* SSD-COCO is designed for **object detection**, identifying and locating objects within an image.

---

## Tools and Technologies Used

* HTML
* CSS
* JavaScript
* TensorFlow.js (CDN)
* Pre-trained Models: MobileNet, SSD-COCO

---

## Result

Successfully implemented browser-based image classification and object detection using TensorFlow.js, and compared the performance and outputs of different pre-trained models.
