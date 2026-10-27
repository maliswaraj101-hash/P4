---
id: relu-layernorm
slug: relu-doesnt-solve-vanishing-gradients-so-why-do-we-still-need-layer-normalization
title: ReLU Doesn’t Solve Vanishing Gradients — So Why Do We Still Need Layer Normalization?
date: 2026-09-11
readingTime: 5 min read
summary: A simple mathematical story about vanishing gradients, exploding gradients, ReLU, and LayerNorm.
mediumHref: https://medium.com/@swarajmali31/relu-doesnt-solve-vanishing-gradients-so-why-do-we-still-need-layer-normalization-56e7eae0f2da
---

First let’s learn what’s vanishing gradient problem,

What does a gradient tell ? — How much should I change this weight to reduce the error.

Let’s start with a tiny neural network

![Tiny neural network](https://miro.medium.com/v2/resize:fit:1364/format:webp/1*cs-yiFcJ4aeckXQ8CHQPpw.png)

during backpropogation, we use the chain Rule

![Chain Rule for the above neural network](https://miro.medium.com/v2/resize:fit:782/format:webp/1*QRNcWVepXJFVpMYWun9wog.png)

here we are multiply many numbers , many numbers < 1 , multiplied together — **gradient vanishes**, meaning its value becomes very low.

![Vanishing gradient](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*1Suet5W5Na-7bd_xmSqZtA.png)

Similarily, in opposite fashion, if large numbers are multiplied together, **gradient explodes!**

I know what’s on your mind, where do these numbers come from, by just looking at these variables its quite confusing.

![Where the numbers come from](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*2rbrf5D3-l0cY5gvOYT9sQ.png)

Let’s see what’s wrong with sigmoid;

![What's wrong with sigmoid](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*FhSB-agRjMMPGaBr_1Q02g.png)

This is the reason why deep neural networks face vanishing gradient problem using sigmoid/tanh.

If we compare sigmoid with RELU;

if **x < 0 → RELU outputs x = 0 , and if x > 0 , RELU outputs x = 1.**

![RELU vs Sigmoid](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*wApWNckzHQzEd5m9wqzhpA.png)

RELU helps vanishing gradient cause any positive value gets converted to **1 ,** after RELU is applied to them , so even if I have a long chain **x → RELU → RELU → RELU** , it will just result into **1 x 1 x 1 = 1**, but if it was Sigmoid , even if we use max sigmoid value ( i.e, 0.25 ), we will get **0.25 x 0.25 x 0.25 = 0.015625,** as u can see this is tending towards ZERO, that’s basically vanishing gradient problem and how RELU helps in it.

## Does RELU completely solve vanishing gradient problem though?

![Dying ReLU](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*2H5-hCzrf0kwZMZlnE_SPA.png)

This is the dying RELU problem , RELU doesn’t help in exploding gradients problem either, if the weights “W” are too large, then RELU can’t handle it, here’s the proof,

![ReLU and exploding gradients](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ivzgOrzrVX1kWT9poL_fUg.png)

So, What does RELU actually solve?

![What ReLU actually solves](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*JnhSVu7LdlJjqk9vdBCVbw.png)

RELU does **not guarantee** that gradients won’t shrink or explode. What it does is avoid one major source of vanishing gradients that occurs with saturating activations like sigmoid/tanh. It helps gradient flow by having derivative 1 in its active region, preventing the activation function itself from continuously shrinking the gradient. It does not prevent vanishing/exploding gradients caused by the weights, and it can produce zero gradients for inactive neuron. If the Weights themselves are scaled badly (too large or too small) as backpropogatino goes on, RELU can’t do anything about it , it will still cause vanishing or exploding gradients. It just solves one part of the problem , vanishing/exploding gradient cause by activation function like sigmoid when passed through them, but it can’t control the scaling cause by the Weights, that’s why **weight matrix initialization plays a crucial role in this.**

![Weight initialization matters](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*JuI1Dxl5UzOwRjhA-kXLag.png)

## Here is where LayerNorm comes in

![LayerNorm](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*KzyzqNy9XTnoX7RUInXGsg.png)

![LayerNorm continued](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*uvdvNlWrHO9YErf5t9puUQ.png)

LayerNorm approximately centres the data around mean = 0 and variance = 1, why specifically these?

**Mean = 0** gives you an equal mix of positive and negative numbers. This balance stops the network from pushing all incoming signals in a single direction. It helps the learning math (gradients) move smoothly in the right direction.

Variance measures how far numbers spread out from the average. Setting it to 1 keeps the spread uniform. Without scaling, numbers can grow massive or shrink to almost nothing as they pass through many layers. A steady variance keeps the signal strength healthy.

So remember,

**RELU — better gradient flow through activation.**

**LayerNorm — stabilize the scale of representations.**

## Putting it together

Conclusion, even RELU + LayerNorm doesn’t always guarantee dismissal of vanishing/exploding gradients, from the article above we know the **Weight (W)** initialization i.e, the initial weight values also matter, cause as we keep moving in the chain during backpropogation **W → W + 🔺W ,** this scale can drift the weights, so weight initialization also matters in this case, this scale drifting is handled by LayerNorm.

For ReLU activation function, usually **He initialization** is used.

Modern deep neural network architectures use further more techniques:

- **residual connections**
- **careful initialization**
- **normalization**
- **appropriate activation functions**
- **optimizer choices**

**Concluding, ReLU and LayerNorm are not redundant: ReLU mainly prevents the activation function itself from continuously shrinking gradients on its positive side, while LayerNorm keeps the numerical scale of activations/representations stable; residual connections and initialization further help gradients travel through very deep networks.**

Peace out! ✌️

![End](https://miro.medium.com/v2/resize:fit:1224/format:webp/1*c6cAtiToEWe5zAHfZ-T8cw.jpeg)
