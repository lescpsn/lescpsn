#include "stdafx.h"

#include <iostream>
#include "filter.hpp"


const char *jpgimage = "D:\\1245107.jpg";

int main() {
	
	cv::Mat image;
	//image = imread("D:\\1.jpg", CV_LOAD_IMAGE_ANYCOLOR);
	image = ReadFile("D:\\1.jpg");
	//system("PAUSE");
	cv::Mat black_white_lut = cv::imread("D:\\tuso_film_2.png");
	if (image.cols == 0 || image.rows == 0) {
		cout << "no image" << endl;
		system("PAUSE");
		return -1;
	}
	cv::imshow("src", image);
	
	int64 e1 = cv::getTickCount();
	//lut_filter(&image, &black_white_lut, 1);
	//brightness_filter(&image, 0.3);
	//gamma_filter(&image, 0.3);
	hue_filter(&image, 0.3);
	//contrast_filter(&image, 0.3);
	//exposure_filter(&image, 0.5);
	//highLightShadow_filter(&image, 1, 100);
	//saturation_filter(&image, 0.3);

	//cv::parallel_for_(Range(0, 1), parallel_for_brightness(&image, 0.1));
	//cv::parallel_for_(Range(0, image.rows), parallel_for_hue(&image, 0.1));
	//cv::parallel_for_(Range(0, image.rows), parallel_for_highLightShadow(&image, 1, 100));
	//cv::parallel_for_(Range(0, image.rows), parallel_for_sharpen(&image, 4, 1, 1));
	//cv::parallel_for_(Range(0, image.rows), parallel_for_contrast(&image, 1));
	
	int64 e2 = cv::getTickCount();
	float time = (double)(e2 - e1) / cv::getTickFrequency();
	cout << "totle time: " << time << endl;
	cv::namedWindow("dst", cv::WINDOW_NORMAL);
	cv::imshow("dst", image);
	//imwrite("D:\\dst.png", image);
	cv::waitKey();
	return 0;
}