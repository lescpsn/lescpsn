#include <opencv2/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include "tool.hpp"
#include <math.h>
#include <iostream>

using namespace cv;
using namespace std;


class parallel_for_lut : public cv::ParallelLoopBody
{
private:
	Mat* src;
	Mat* lut;
	float linear;
public:
	parallel_for_lut(Mat* _src, Mat* _lut, float _linear)
	{
		src = _src;
		lut = _lut;
		linear = _linear;
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				double b = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y)) / 255;
				double g = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1())) / 255;
				double r = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2)) / 255;
				double blueColor = b * 63.0;
				//cout << "r, g, b: " << r << " " << g << " " << b << endl;

				cv::Vec2d quad1, quad2;
				cv::Vec2d texPos1, texPos2;
				cv::Vec3d newColor, newColor1, newColor2, newColor3;

				quad1[1] = floor(floor(blueColor) / 8.0);
				quad1[0] = floor(blueColor) - (quad1[1] * 8.0);


				quad2[1] = floor(ceil(blueColor) / 8.0);
				quad2[0] = ceil(blueColor) - (quad2[1] * 8.0);

				texPos1[0] = ((quad1[0] * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * r));
				texPos1[1] = ((quad1[1] * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * g));
				//cout << texPos1 << endl;
				//cout << int(texPos1[0] * 512) << " " << int( texPos1[1] * 512) << endl;

				texPos2[0] = ((quad2[0] * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * r));
				texPos2[1] = ((quad2[1] * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * g));

				//cout << texPos2 << endl;
				//cout << int(texPos2[0] * 512) << " " << int(texPos2[1] * 512) << endl;

				newColor1 = (*lut).at<Vec3b>((int)(texPos1[1] * 512.0), (int)(texPos1[0] * 512.0));
				newColor1 = newColor1 / 255;

				//cout << newColor1 << endl;

				newColor2 = (*lut).at<Vec3b>((int)(texPos2[1] * 512.0), (int)(texPos2[0] * 512.0));
				newColor2 = newColor2 / 255;
				//cout << texPos2 << endl;
				//cout << newColor2 << endl;

				newColor = *Mix(newColor1, newColor2, fract(blueColor));
				//cout << newColor << endl;
				newColor3 = *Mix(Vec3d(b, g, r), newColor, linear);
				//cout << newColor3 << endl;
				//system("PAUSE");
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(newColor3[0] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(newColor3[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(newColor3[2] * 255);
			}
		}
	}
};

class parallel_for_wb : public cv::ParallelLoopBody
{
private:
	Mat* src;
	float tint;
	float temperature;
	cv::Vec3f warmFilter = Vec3f(0.93, 0.54, 0.0);//RGB
	double RGBtoYIQ[9]  = {
		0.299, 0.587, 0.114,
		0.596, -0.274, -0.322,
		0.212, -0.523, 0.311
	};
	double YIQtoRGB[9] = {
		1.0, 0.956, 0.621,
		1.0, -0.272, -0.647,
		1.0, -1.105, 1.702
	};
public:
	parallel_for_wb(Mat* _src, float _tint, float _temperature)
	{
		src = _src;
		tint = _tint;
		temperature = _temperature;
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				cv::Vec3d source = Vec3d(
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y) / 255,
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) / 255,
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) / 255
				);
				//system("PAUSE");
				//float i = RGBtoYIQ[1] * 1;
				cv::Vec3d yiq = *MulTo3X3(source, RGBtoYIQ);
				cv::Vec3d rgb = *MulTo3X3(yiq, RGBtoYIQ);
				cv::Vec3d processed = cv::Vec3d(
					(rgb[2] < 0.5 ? (2.0 * rgb[2] * warmFilter[0]) : (1.0 - 2.0 * (1.0 - rgb[2]) * (1.0 - warmFilter[0]))),
					(rgb[1] < 0.5 ? (2.0 * rgb[1] * warmFilter[1]) : (1.0 - 2.0 * (1.0 - rgb[1]) * (1.0 - warmFilter[1]))),
					(rgb[0] < 0.5 ? (2.0 * rgb[0] * warmFilter[2]) : (1.0 - 2.0 * (1.0 - rgb[0]) * (1.0 - warmFilter[2])))
				);
				
				cv::Vec3d newColor = *Mix(rgb, processed, temperature);
				//cout << yiq << endl;
				//system("PAUSE");
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(newColor[0] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(newColor[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(newColor[2] * 255);

			}
		}
	}
};

class parallel_for_exposure : public cv::ParallelLoopBody
{
private:
	Mat* src;
	float exposure;
public:
	parallel_for_exposure(Mat* _src, float _exposure)
	{
		src = _src;
		exposure = _exposure;
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				cv::Vec3d source = Vec3d(
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y) / 255,
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) / 255,
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) / 255
				);
				cv::Vec3d newColor = source * pow(2.0, exposure);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(newColor[0] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(newColor[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(newColor[2] * 255);
			}
		}
	}
};

class parallel_for_saturation : public cv::ParallelLoopBody
{
private:
	Mat* src;
	float saturation;
	//0.2125, 0.7154, 0.0721
	cv::Vec3d luminanceWeighting = cv::Vec3d(0.0721, 0.7154, 0.2125);
public:
	parallel_for_saturation(Mat* _src, float _saturation)
	{
		src = _src;
		saturation = _saturation;
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				cv::Vec3d source = Vec3d(
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y) / 255,
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) / 255,
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) / 255
				);
				double luminance = dot(luminanceWeighting, source);
				cv::Vec3d greyScaleColor = cv::Vec3d(luminance, luminance, luminance);
				cv::Vec3d newColor = *Mix(greyScaleColor, source, saturation);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(newColor[0] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(newColor[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(newColor[2] * 255);
			}
		}
	}
};

class parallel_for_hue : public cv::ParallelLoopBody
{
private:
	Mat* src;
	float hueAdjust;
	cv::Vec3d kRGBToYPrime = cv::Vec3d(0.299, 0.587, 0.114);
	cv::Vec3d kRGBToI = cv::Vec3d(0.595716, -0.274453, -0.321263);
	cv::Vec3d kRGBToQ = cv::Vec3d(0.211456, -0.522591, 0.31135);

	cv::Vec3d kYIQToR = cv::Vec3d(1.0, 0.9563, 0.6210);
	cv::Vec3d kYIQToG = cv::Vec3d(1.0, -0.2721, -0.6474);
	cv::Vec3d kYIQToB = cv::Vec3d(1.0, -1.1070, 1.7046);
public:
	parallel_for_hue(Mat* _src, float _hueAdjust)
	{
		src = _src;
		hueAdjust = _hueAdjust;
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				// from BGR to RGB
				cv::Vec3d color = Vec3d(
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) / 255, // r
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) / 255, //g
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y) / 255 //b
				);
				// Convert to YIQ
				double YPrime = dot(color, kRGBToYPrime);
				double I = dot(color, kRGBToI);
				double Q = dot(color, kRGBToQ);

				float   hue = atan2(Q, I);
				float   chroma = sqrt(I * I + Q * Q);
				hue += (-hueAdjust);

				Q = chroma * sin(hue);
				I = chroma * cos(hue);
				cv::Vec3d yIQ = cv::Vec3d(YPrime, I, Q);
				color[0] = dot(yIQ, kYIQToR);
				color[1] = dot(yIQ, kYIQToG);
				color[2] = dot(yIQ, kYIQToB);
				// Convert rgb to bgr
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(color[0] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(color[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(color[2] * 255);
			}
		}
	}
};

class parallel_for_contrast : public cv::ParallelLoopBody
{
private:
	Mat* src;
	float contrast;
public:
	parallel_for_contrast(Mat* _src, float _contrast)
	{
		src = _src;
		contrast = _contrast;
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				double b = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y)) / 255;
				double g = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1())) / 255;
				double r = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2)) / 255;
				cv::Vec3f newColor = cv::Vec3f(
					(double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y)) / 255,
					(double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1())) / 255,
					(double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2)) / 255
				) - cv::Vec3f(0.5, 0.5, 0.5) * contrast + cv::Vec3f(0.5, 0.5, 0.5);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(newColor[0] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(newColor[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(newColor[2] * 255);
			}
		}
	}
};

//class parallel_for_gamma : public cv::ParallelLoopBody
//{
//private:
//	Mat* src;
//	float gamma;
//public:
//	parallel_for_gamma(Mat* _src, float _gamma)
//	{
//		src = _src;
//		gamma = _gamma;
//	}
//	void operator()(const Range& range) const
//	{
//		for (int x = range.start; x < range.end; ++x)
//		{
//			for (int y = 0; y < (*src).cols; y++) {
//				double b = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y)) / 255;
//				double g = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1())) / 255;
//				double r = (double)(*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2)) / 255;
//
//				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(pow(b, gamma) * 255);
//				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(pow(g, gamma) * 255);
//				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(pow(r, gamma) * 255);
//			}
//		}
//	}
//};

class parallel_for_gamma : public cv::ParallelLoopBody
{
private:
	Mat* src;
	float gamma;
	unsigned char lut[256];
public:
	parallel_for_gamma(Mat* _src, float _gamma)
	{
		src = _src;
		gamma = _gamma;
		for (int i = 0; i < 256; i++)
		{
			lut[i] = pow((float)(i / 255.0), _gamma) * 255.0;
		}
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{			
			for (int y = 0; y < (*src).cols; y++) {

				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = lut[*((*src).data + (*src).step[0] * x + (*src).step[1] * y)];
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = lut[*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1())];
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = lut[*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2)];
			}
		}
	}
};



class parallel_for_highLightShadow : public cv::ParallelLoopBody
{
private:
	Mat* src;
	float shadows;
	float highlights;
	cv::Vec3d luminanceWeighting = cv::Vec3d(0.3, 0.3, 0.3);
public:
	parallel_for_highLightShadow(Mat* _src, float _shadows, float _highlights)
	{
		src = _src;
		shadows = _shadows;
		highlights = _highlights;
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				cv::Vec3d source = Vec3d(
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) / 255, // r
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) / 255, //g
					(double)*((*src).data + (*src).step[0] * x + (*src).step[1] * y) / 255 //b
				);
				float luminance = dot(source, luminanceWeighting);
				float shadow = clamp((pow(luminance, 1.0 / (shadows + 1.0)) + (-0.76)*pow(luminance, 2.0 / (shadows + 1.0))) - luminance, 0.0, 1.0);
				float highlight = clamp((1.0 - (pow(1.0 - luminance, 1.0 / (2.0 - highlights)) + (-0.8)*pow(1.0 - luminance, 2.0 / (2.0 - highlights)))) - luminance, -1.0, 0.0);
				cv::Vec3d result = cv::Vec3d(0.0, 0.0, 0.0) + ((luminance + shadow + highlight) - 0.0) * ((source - cv::Vec3d(0.0, 0.0, 0.0)) / (luminance - 0.0));
				
				//*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = (int)(result[2] * 255);
				//*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = (int)(result[1] * 255);
				//*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = (int)(result[0] * 255);
				
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = saturate_cast<uchar>(result[2] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = saturate_cast<uchar>(result[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = saturate_cast<uchar>(result[0] * 255);
			}
		}
	}
};

class parallel_for_sharpen : public cv::ParallelLoopBody
{
private:
	Mat* src;
	Mat* old;
	float imageWidthFactor;
	float imageHeightFactor;
	float sharpness;
	float centerMultiplier;
	float edgeMultiplier;
	cv::Vec3d luminanceWeighting = cv::Vec3d(0.3, 0.3, 0.3);
public:
	parallel_for_sharpen(Mat* _src, float _sharpness, float _imageWidthFactor, float _imageHeightFactor)
	{
		src = _src;
		if (_sharpness > 4) {
			sharpness = 4;
		}
		else if (_sharpness < -4) {
			sharpness = -4;
		}
		else {
			sharpness = _sharpness;
		}
		cv::Mat _old;
		(*src).copyTo(_old);
		old = &_old;
		imageWidthFactor = _imageWidthFactor;
		imageHeightFactor = _imageHeightFactor;
		centerMultiplier = 1.0 + 4.0 * sharpness;
		edgeMultiplier = sharpness;
		
	}
	void operator()(const Range& range) const
	{
		for (int x = range.start; x < range.end; ++x)
		{
			for (int y = 0; y < (*src).cols; y++) {
				// RGB
				cv::Vec3d textureColor = Vec3d(
					(double)*((*old).data + (*old).step[0] * x + (*old).step[1] * y + (*old).elemSize1() * 2) / 255, // r
					(double)*((*old).data + (*old).step[0] * x + (*old).step[1] * y + (*old).elemSize1()) / 255, //g
					(double)*((*old).data + (*old).step[0] * x + (*old).step[1] * y) / 255 //b
				);
				cout << textureColor << endl;
				cv::Vec3d leftTextureColor = safeAt(old, (int)(x - imageWidthFactor), y);
				cv::Vec3d rightTextureColor = safeAt(old, (int)(x + imageWidthFactor), y);
				cv::Vec3d topTextureColor = safeAt(old, x, (int)(y + imageHeightFactor));
				cv::Vec3d bottomTextureColor = safeAt(old, x, (int)(y - imageHeightFactor));
				//cout << edgeMultiplier << endl;
				//cout << centerMultiplier << endl;
				//cout << leftTextureColor << leftTextureColor * edgeMultiplier << endl;
				//cout << cv::Vec3d(1, 1, 1) * 3 << endl;
				//system("PAUSE");
				cv::Vec3d result;
				result[0] = (textureColor[0] * centerMultiplier - (leftTextureColor[0] * edgeMultiplier + rightTextureColor[0] * edgeMultiplier + topTextureColor[0] * edgeMultiplier + bottomTextureColor[0] * edgeMultiplier));
				result[1] = (textureColor[1] * centerMultiplier - (leftTextureColor[1] * edgeMultiplier + rightTextureColor[1] * edgeMultiplier + topTextureColor[1] * edgeMultiplier + bottomTextureColor[0] * edgeMultiplier));
				result[2] = (textureColor[2] * centerMultiplier - (leftTextureColor[2] * edgeMultiplier + rightTextureColor[2] * edgeMultiplier + topTextureColor[2] * edgeMultiplier + bottomTextureColor[0] * edgeMultiplier));
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y) = (int)(result[2] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1()) = (int)(result[1] * 255);
				*((*src).data + (*src).step[0] * x + (*src).step[1] * y + (*src).elemSize1() * 2) = (int)(result[0] * 255);
			}
		}
	}
};

void lut_filter(Mat* _src, Mat* _lut, float _linear) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_lut(_src, _lut, _linear));
}
//已优化
void brightness_filter(Mat* _src, float _brightness) {
	(*_src).convertTo((*_src), -1, 1, _brightness * 255);
}

void hue_filter(Mat* _src, float _hueAdjust) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_hue(_src, 0.1));
}
//已优化
void gamma_filter(Mat* _src, float _gamma) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_gamma(_src, _gamma));
}

void wb_filter(Mat* _src, float _tint, float _temperature) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_wb(_src, _tint, _temperature));
}

void contrast_filter(Mat* _src, float _contrast) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_contrast(_src, _contrast));
}

void exposure_filter(Mat* _src, float _exposure) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_exposure(_src, _exposure));
}

void highLightShadow_filter(Mat* _src, float _shadows, float _highlights) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_highLightShadow(_src, _shadows, _highlights));
}

void saturation_filter(Mat* _src, float _saturation) {
	cv::parallel_for_(Range(0, (*_src).rows), parallel_for_saturation(_src, _saturation));
}
